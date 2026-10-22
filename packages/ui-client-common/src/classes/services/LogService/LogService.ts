import { isAxiosError } from 'axios';
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  CommonDbExternalLogItem,
  CommonDbSystemApi,
} from '@gen-epix/api-commondb';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';
import {
  inject,
  singleton,
} from 'tsyringe';

import { API_SYSTEM_TOKEN } from '../../../constants/api.constants';
import { AuthenticationService } from '../AuthenticationService';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { CONFIG_TOKEN } from '../../../constants/config.constants';
import type { ConfigBase } from '../../../models/config.models';

type LogServiceItem = {
  detail?: unknown;
  duration?: number;
  level: CommonDbLogLevel;
  topic: string;
};

@singleton()
export class LogService {
  protected readonly requestMap: Map<string, number>;

  private readonly authenticationService: AuthenticationService;
  private readonly config: Pick<ConfigBase, 'getSoftwareVersion' | 'log'>;
  private logItems: CommonDbExternalLogItem[] = [];
  private readonly systemApi: CommonDbSystemApi;

  public constructor(
    @inject(CONFIG_TOKEN) config: ConfigBase,
    @inject(AuthenticationService) authenticationService: AuthenticationService,
    @inject(API_SYSTEM_TOKEN) systemApi: CommonDbSystemApi,
  ) {
    this.requestMap = new Map<string, number>();
    this.config = config;
    this.authenticationService = authenticationService;
    this.systemApi = systemApi;
    setInterval(() => {
      this.sendLog();
    }, config.log.LOG_INTERVAL_MS);
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
        detail: item.detail === undefined || item.detail === null ? null : JSON.stringify(item.detail),
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

    const requestId = response.config.headers.get('X-REQUEST-ID');
    const requestStartedAt = typeof requestId === 'string' ? this.requestMap.get(requestId) : undefined;
    const duration = requestStartedAt === undefined ? undefined : Date.now() - requestStartedAt;
    if (typeof requestId === 'string') {
      this.requestMap.delete(requestId);
    }

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
      const requestId = error.config?.headers.get('X-REQUEST-ID');
      if (AxiosUtil.isAxiosCanceledError(error)) {
        if (typeof requestId === 'string') {
          this.requestMap.delete(requestId);
        }
        return;
      }
      const requestStartedAt = typeof requestId === 'string' ? this.requestMap.get(requestId) : undefined;
      const duration = requestStartedAt === undefined ? undefined : Date.now() - requestStartedAt;
      if (typeof requestId === 'string') {
        this.requestMap.delete(requestId);
      }
      this.log([{
        detail: {
          requestParams: error.config?.params as unknown,
          responseData: error.response?.data as unknown,
          status: error.response?.status,
          url: error.config?.url,
        },
        duration,
        level: CommonDbLogLevel.ERROR,
        topic: 'RESPONSE_ERROR',
      }]);
    } else {
      this.log([{
        detail: {
          error: error instanceof Error ? error.message : error,
        },
        level: CommonDbLogLevel.ERROR,
        topic: 'RESPONSE_ERROR',
      }]);
    }
  }

  private sendLog(): void {
    if (!this.logItems.length || !this.authenticationService?.authContextProps?.isAuthenticated) {
      return;
    }
    if (document.location.href.includes('accept-invitation')) {
      return;
    }
    this.systemApi.log({
      log_items: this.logItems,
    }, {
      headers: {
        'X-IGNORE-LOG': '1',
      },
    }).catch((error: unknown) => {
      console.error('Failed to send logs', error);
    });
    this.logItems = [];
  }
}
