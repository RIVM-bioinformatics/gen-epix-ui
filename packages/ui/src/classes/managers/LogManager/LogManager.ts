import { isAxiosError } from 'axios';
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';
import type { CommonDbLogItem } from '@gen-epix/api-commondb';

import { HmrUtil } from '../../../utils/HmrUtil';
import { AuthenticationManager } from '../AuthenticationManager';
import { ConfigManager } from '../ConfigManager';
import { StringUtil } from '../../../utils/StringUtil';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { ApiManager } from '../ApiManager';

type LogManagerItem = {
  detail?: unknown;
  duration?: number;
  level: CommonDbLogLevel;
  topic: string;
};

export class LogManager {
  private static __instance: LogManager;

  protected readonly requestMap: Map<string, number>;

  private logItems: CommonDbLogItem[] = [];

  private constructor() {
    this.requestMap = new Map<string, number>();
    setInterval(() => {
      this.sendLog();
    }, ConfigManager.getInstance().config.log.LOG_INTERVAL_MS);
  }

  public static getInstance(): LogManager {
    LogManager.__instance = HmrUtil.getHmrSingleton('logManager', LogManager.__instance, () => new LogManager());
    return LogManager.__instance;
  }

  public flushLog(): void {
    this.sendLog();
  }

  public log(items: LogManagerItem[]): void {
    const timestamp = new Date().toISOString();
    const software_version = ConfigManager.getInstance().config.getSoftwareVersion();
    this.logItems.push(...items.map<CommonDbLogItem>(item => {
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
    if (!this.logItems.length || !AuthenticationManager.getInstance()?.authContextProps?.isAuthenticated) {
      return;
    }
    if (document.location.href.includes('accept-invitation')) {
      return;
    }
    ApiManager.getInstance().systemApi.log({
      log_items: this.logItems,
    }, {
      headers: {
        'X-IGNORE-LOG': '1',
      },
    }).catch(() => 0);
    this.logItems = [];
  }
}
