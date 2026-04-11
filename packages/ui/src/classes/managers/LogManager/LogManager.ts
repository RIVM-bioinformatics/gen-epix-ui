import {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  isAxiosError,
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
  duration?: number;
  level: LogLevel;
  topic: string;
};

export class LogManager {
  public static get instance(): LogManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.log = WindowManager.instance.window.managers.log || new LogManager();
    return WindowManager.instance.window.managers.log;
  }
  protected readonly requestMap: Map<string, number>;

  private logItems: LogItem[] = [];

  private constructor() {
    this.requestMap = new Map<string, number>();
    setInterval(() => {
      this.sendLog();
    }, ConfigManager.instance.config.log.LOG_INTERVAL_MS);
  }

  public flushLog(): void {
    this.sendLog();
  }

  public log(items: LogManagerItem[]): void {
    const timestamp = new Date().toISOString();
    const software_version = ConfigManager.instance.config.getSoftwareVersion();
    this.logItems.push(...items.map<LogItem>(item => {
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
      level: LogLevel.TRACE,
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
      level: response.status >= 200 && response.status < 300 ? LogLevel.TRACE : LogLevel.ERROR,
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
        level: LogLevel.ERROR,
        topic: 'RESPONSE_ERROR',
      }]);
    } else {
      this.log([{
        detail: {
          error,
        },
        level: LogLevel.ERROR,
        topic: 'RESPONSE_ERROR',
      }]);
    }
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
}
