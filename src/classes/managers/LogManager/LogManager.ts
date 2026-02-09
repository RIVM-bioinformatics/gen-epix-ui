import {
  isAxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { AuthenticationManager } from '../AuthenticationManager';
import { ConfigManager } from '../ConfigManager';
import { WindowManager } from '../WindowManager';
import {
  type LogItem,
  LogLevel,
} from '../../../api';
import { SystemApi } from '../../../api';
import { StringUtil } from '../../../utils/StringUtil';
import { AxiosUtil } from '../../../utils/AxiosUtil';

type LogManagerItem = {
  detail?: unknown;
  topic: string;
  duration?: number;
  level: LogLevel;
};

export class LogManager {
  protected readonly requestMap: Map<string, number>;
  private logItems: LogItem[] = [];

  public static get instance(): LogManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.log = WindowManager.instance.window.managers.log || new LogManager();
    return WindowManager.instance.window.managers.log;
  }

  private constructor() {
    this.requestMap = new Map<string, number>();
    setInterval(() => {
      this.sendLog();
    }, ConfigManager.instance.config.log.LOG_INTERVAL_MS);
  }

  public log(items: LogManagerItem[]): void {
    const timestamp = new Date().toISOString();
    const software_version = ConfigManager.instance.config.getSoftwareVersion();
    this.logItems.push(...items.map<LogItem>(item => {
      return {
        timestamp,
        software_version,
        level: item.level,
        detail: item.detail ? JSON.stringify(item.detail) : null,
        topic: item.topic ?? null,
        command_id: StringUtil.createUuid(),
        duration: item.duration ?? null,
      };
    }));
  }

  public flushLog(): void {
    this.sendLog();
  }

  private sendLog(): void {
    if (!this.logItems.length || !AuthenticationManager.instance?.authContextProps?.isAuthenticated) {
      return;
    }
    if (document.location.href.includes('accept-invitation')) {
      return;
    }
    SystemApi.instance.log({
      log_items: this.logItems,
    }, {
      headers: {
        'X-IGNORE-LOG': '1',
      },
    }).catch(() => 0);
    this.logItems = [];
  }

  public onRequest(request: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    if (request.headers.has('X-IGNORE-LOG')) {
      return request;
    }
    const requestId = StringUtil.createUuid();
    request.headers.set('X-REQUEST-ID', requestId);
    this.requestMap.set(requestId, new Date().getTime());

    this.log([{
      topic: 'REQUEST',
      detail: {
        url: request.url,
        requestParams: request.params as unknown,
        requestData: request.data as unknown,
      },
      level: LogLevel.TRACE,
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
      topic: 'RESPONSE',
      detail: {
        url: response.config.url,
        requestParams: response.config.params as unknown,
        requestData: response.config.data as unknown,
      },
      duration,
      level: response.status >= 200 && response.status < 300 ? LogLevel.TRACE : LogLevel.ERROR,
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
        topic: 'RESPONSE_ERROR',
        detail: {
          url: error.config.url,
          status: error.response.status,
          responseData: error.response.data as unknown,
          requestParams: error.config.params as unknown,
        },
        duration,
        level: LogLevel.ERROR,
      }]);
    } else {
      this.log([{
        topic: 'RESPONSE_ERROR',
        detail: {
          error,
        },
        level: LogLevel.ERROR,
      }]);
    }
  }
}
