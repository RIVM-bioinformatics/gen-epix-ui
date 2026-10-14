import { isAxiosError } from 'axios';
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';
import type { CommonDbExternalLogItem } from '@gen-epix/api-commondb';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';
import {
  inject,
  container as rootContainer,
  singleton,
} from 'tsyringe';

import { API_SYSTEM_TOKEN } from '../../../models/api';
import { AuthenticationService } from '../AuthenticationService';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { CONFIG_TOKEN } from '../../../constants/config';
import type { ConfigBase } from '../../../models/config';

type LogServiceItem = {
  detail?: unknown;
  duration?: number;
  level: CommonDbLogLevel;
  topic: string;
};

@singleton()
export class LogService {
  protected readonly requestMap: Map<string, number>;

  private readonly config: Pick<ConfigBase, 'getSoftwareVersion' | 'log'>;
  private logItems: CommonDbExternalLogItem[] = [];

  public constructor(@inject(CONFIG_TOKEN) config: ConfigBase) {
    this.requestMap = new Map<string, number>();
    this.config = config;
    setInterval(() => {
      this.sendLog();
    }, config.log.LOG_INTERVAL_MS);
  }

  public static getInstance(): LogService {
    return rootContainer.resolve(LogService);
  }

  public flushLog(): void {
    this.sendLog();
  }

  public log(items: LogServiceItem[]): void {
    const timestamp = new Date().toISOString();
    const software_version = this.config.getSoftwareVersion();
    this.logItems.push(...items.map<CommonDbExternalLogItem>(item => {
      return {
        command_id: StringUtil.createUuid(),
        detail: item.detail ? JSON.stringify(item.detail) : null,
        duration: item.duration ?? null,
        level: item.level,
        software_version,
        timestamp,
        topic: item.topic ?? null,
      };
    }));
  }

  public onRequest(request: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    if (request.headers.has('X-IGNORE-LOG')) {
      return request;
    }
    const requestId = StringUtil.createUuid();
    request.headers.set('X-REQUEST-ID', requestId);
    this.requestMap.set(requestId, new Date().getTime());

    this.log([{
      detail: {
        requestData: request.data as unknown,
        requestParams: request.params as unknown,
        url: request.url,
      },
      level: CommonDbLogLevel.TRACE,
      topic: 'REQUEST',
    }]);

    return request;
  }

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    if (response.config.headers.has('X-IGNORE-LOG')) {
      return response;
    }

    const requestId = response?.config?.headers.get('X-REQUEST-ID') as string;
    const duration = new Date().getTime() - this.requestMap.get(requestId);

    this.log([{
      detail: {
        requestData: response.config.data as unknown,
        requestParams: response.config.params as unknown,
        url: response.config.url,
      },
      duration,
      level: response.status >= 200 && response.status < 300 ? CommonDbLogLevel.TRACE : CommonDbLogLevel.ERROR,
      topic: 'RESPONSE',
    }]);

    return response;
  }

  public onResponseRejected(error: unknown): void {
    if (isAxiosError(error)) {
      if (AxiosUtil.isAxiosCanceledError(error)) {
        return;
      }
      const requestId = error?.config?.headers.get('X-REQUEST-ID') as string;
      const duration = new Date().getTime() - this.requestMap.get(requestId);
      this.log([{
        detail: {
          requestParams: error.config.params as unknown,
          responseData: error.response.data as unknown,
          status: error.response.status,
          url: error.config.url,
        },
        duration,
        level: CommonDbLogLevel.ERROR,
        topic: 'RESPONSE_ERROR',
      }]);
    } else {
      this.log([{
        detail: {
          error,
        },
        level: CommonDbLogLevel.ERROR,
        topic: 'RESPONSE_ERROR',
      }]);
    }
  }

  private sendLog(): void {
    if (!this.logItems.length || !AuthenticationService.getInstance()?.authContextProps?.isAuthenticated) {
      return;
    }
    if (document.location.href.includes('accept-invitation')) {
      return;
    }
    rootContainer.resolve(API_SYSTEM_TOKEN).log({
      log_items: this.logItems,
    }, {
      headers: {
        'X-IGNORE-LOG': '1',
      },
    }).catch(() => 0);
    this.logItems = [];
  }
}
