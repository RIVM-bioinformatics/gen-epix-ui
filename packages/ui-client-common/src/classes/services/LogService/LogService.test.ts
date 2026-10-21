import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
} from 'axios';
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';
import type {
  CommonDbExternalLogItem,
  CommonDbSystemApi,
} from '@gen-epix/api-commondb';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';

import type { AuthenticationService } from '../AuthenticationService';
import type { ConfigBase } from '../../../models/config.models';

import { LogService } from './LogService';

type ApiLogMock = {
  mock: {
    calls: Array<[LogPayload, LogOptions]>;
  };
};

type LogOptions = {
  headers: {
    'X-IGNORE-LOG': string;
  };
};

type LogPayload = {
  log_items: CommonDbExternalLogItem[];
};

class TestLogService extends LogService {
  public get pendingRequestCount(): number {
    return this.requestMap.size;
  }
}

const createRequestConfig = (): InternalAxiosRequestConfig => ({
  data: { filter: 'active' },
  headers: new AxiosHeaders(),
  params: { page: 1 },
  url: '/records',
});

const createResponse = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = { result: 'ok' },
): AxiosResponse => ({
  config,
  data,
  headers: new AxiosHeaders(),
  status,
  statusText: 'Response',
});

const createAxiosError = (
  config?: InternalAxiosRequestConfig,
  response?: AxiosResponse,
): AxiosError => {
  const error = new AxiosError('Request failed');
  error.config = config;
  error.response = response;
  return error;
};

const createService = (isAuthenticated = true) => {
  const apiLog = vi.fn(async (_payload: LogPayload, _options: LogOptions) => Promise.resolve());
  const systemApi = { log: apiLog } as unknown as CommonDbSystemApi;
  const authContextProps = { isAuthenticated };
  const authenticationService = { authContextProps } as unknown as AuthenticationService;
  const config = {
    getSoftwareVersion: () => '1.2.3',
    log: { LOG_INTERVAL_MS: 60000 },
  } as ConfigBase;
  const service = new TestLogService(config, authenticationService, systemApi);

  return {
    apiLog,
    authContextProps,
    service,
  };
};

const getSentLogItems = (apiLog: ApiLogMock): CommonDbExternalLogItem[] => {
  const sentLogItems = apiLog.mock.calls[0]?.[0].log_items;
  if (!sentLogItems) {
    throw new Error('No log items were sent');
  }
  return sentLogItems;
};

describe('LogService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    let uuidCount = 0;
    vi.spyOn(StringUtil, 'createUuid').mockImplementation(() => `uuid-${++uuidCount}`);
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('serializes falsey details, preserves zero durations, and adds shared metadata', () => {
    const { apiLog, service } = createService();
    service.log([
      { detail: false, duration: 0, level: CommonDbLogLevel.TRACE, topic: 'false' },
      { detail: 0, level: CommonDbLogLevel.TRACE, topic: 'zero' },
      { detail: '', level: CommonDbLogLevel.TRACE, topic: 'empty' },
      { detail: null, level: CommonDbLogLevel.TRACE, topic: 'null' },
      { level: CommonDbLogLevel.TRACE, topic: 'missing' },
      { level: CommonDbLogLevel.TRACE, topic: null },
    ]);

    service.flushLog();

    const sentItems = getSentLogItems(apiLog);
    expect(sentItems.map(item => item.detail)).toEqual(['false', '0', '""', null, null, null]);
    expect(sentItems.map(item => item.duration)).toEqual([0, null, null, null, null, null]);
    expect(sentItems.map(item => item.software_version)).toEqual(['1.2.3', '1.2.3', '1.2.3', '1.2.3', '1.2.3', '1.2.3']);
    expect(sentItems[5]?.topic).toBeNull();
    expect(new Set(sentItems.map(item => item.timestamp)).size).toBe(1);
  });

  it('retains queued logs while unauthenticated or on the invitation page, then sends once', () => {
    const { apiLog, authContextProps, service } = createService(false);
    service.log([{ level: CommonDbLogLevel.ERROR, topic: 'test' }]);

    service.flushLog();
    expect(apiLog).not.toHaveBeenCalled();

    authContextProps.isAuthenticated = true;
    window.history.replaceState({}, '', '/accept-invitation');
    service.flushLog();
    expect(apiLog).not.toHaveBeenCalled();

    window.history.replaceState({}, '', '/records');
    service.flushLog();
    expect(apiLog).toHaveBeenCalledOnce();

    service.flushLog();
    expect(apiLog).toHaveBeenCalledOnce();
  });

  it('sends queued logs on the configured interval', () => {
    const { apiLog, service } = createService();
    service.log([{ level: CommonDbLogLevel.TRACE, topic: 'interval' }]);

    vi.advanceTimersByTime(60000);

    expect(apiLog).toHaveBeenCalledOnce();
    expect(getSentLogItems(apiLog)).toHaveLength(1);
  });

  it('returns ignored requests unchanged without creating a log or request entry', () => {
    const { apiLog, service } = createService();
    const request = createRequestConfig();
    request.headers.set('X-IGNORE-LOG', '1');

    expect(service.onRequest(request)).toBe(request);
    expect(service.pendingRequestCount).toBe(0);

    service.flushLog();
    expect(apiLog).not.toHaveBeenCalled();
  });

  it('adds a request id and logs request details for ordinary requests', () => {
    const { apiLog, service } = createService();
    const request = createRequestConfig();

    expect(service.onRequest(request)).toBe(request);
    expect(request.headers.get('X-REQUEST-ID')).toBe('uuid-1');
    expect(service.pendingRequestCount).toBe(1);

    service.flushLog();

    const [requestLog] = getSentLogItems(apiLog);
    expect(requestLog.topic).toBe('REQUEST');
    expect(requestLog.level).toBe(CommonDbLogLevel.TRACE);
    expect(JSON.parse(requestLog.detail)).toEqual({
      requestData: { filter: 'active' },
      requestParams: { page: 1 },
      url: '/records',
    });
  });

  it('logs successful responses with their duration and clears the request entry', () => {
    vi.setSystemTime(new Date(0));
    const { apiLog, service } = createService();
    const request = createRequestConfig();
    service.onRequest(request);
    vi.advanceTimersByTime(125);
    const response = createResponse(request, 200);

    expect(service.onResponseFulfilled(response)).toBe(response);
    expect(service.pendingRequestCount).toBe(0);

    service.flushLog();

    const sentItems = getSentLogItems(apiLog);
    expect(sentItems.map(item => item.topic)).toEqual(['REQUEST', 'RESPONSE']);
    expect(sentItems[1]?.duration).toBe(125);
    expect(sentItems[1]?.level).toBe(CommonDbLogLevel.TRACE);
  });

  it.each([
    [199, CommonDbLogLevel.ERROR],
    [299, CommonDbLogLevel.TRACE],
    [300, CommonDbLogLevel.ERROR],
  ])('classifies response status %s and handles responses without request ids', (status, expectedLevel) => {
    const { apiLog, service } = createService();
    const response = createResponse(createRequestConfig(), status);

    service.onResponseFulfilled(response);
    service.flushLog();

    const [responseLog] = getSentLogItems(apiLog);
    expect(responseLog.level).toBe(expectedLevel);
    expect(responseLog.duration).toBeNull();
  });

  it('returns ignored responses unchanged without logging them', () => {
    const { apiLog, service } = createService();
    const response = createResponse(createRequestConfig(), 200);
    response.config.headers.set('X-IGNORE-LOG', '1');

    expect(service.onResponseFulfilled(response)).toBe(response);

    service.flushLog();
    expect(apiLog).not.toHaveBeenCalled();
  });

  it('logs non-Axios errors', () => {
    const { apiLog, service } = createService();
    service.onResponseRejected(new Error('plain failure'));
    service.onResponseRejected('plain failure');

    service.flushLog();

    const sentItems = getSentLogItems(apiLog);
    expect(sentItems.map(item => item.detail)).toEqual([
      '{"error":"plain failure"}',
      '{"error":"plain failure"}',
    ]);
    expect(sentItems.every(item => item.topic === 'RESPONSE_ERROR' && item.level === CommonDbLogLevel.ERROR)).toBe(true);
  });

  it('ignores canceled requests and clears their request entry', () => {
    const { apiLog, service } = createService();
    const request = createRequestConfig();
    service.onRequest(request);
    const error = new CanceledError('request cancelled');
    error.config = request;

    service.onResponseRejected(error);
    service.onResponseRejected(new CanceledError('cancelled without request configuration'));

    expect(service.pendingRequestCount).toBe(0);
    service.flushLog();
    expect(getSentLogItems(apiLog)).toHaveLength(1);
  });

  it('logs Axios response errors and clears their request entry', () => {
    const { apiLog, service } = createService();
    const request = createRequestConfig();
    service.onRequest(request);
    vi.advanceTimersByTime(50);
    const error = createAxiosError(request, createResponse(request, 500, { message: 'server error' }));

    service.onResponseRejected(error);

    expect(service.pendingRequestCount).toBe(0);
    service.flushLog();

    const sentItems = getSentLogItems(apiLog);
    const errorLog = sentItems[1];
    expect(errorLog?.topic).toBe('RESPONSE_ERROR');
    expect(errorLog?.level).toBe(CommonDbLogLevel.ERROR);
    expect(errorLog?.duration).toBe(50);
    expect(JSON.parse(errorLog?.detail)).toEqual({
      requestParams: { page: 1 },
      responseData: { message: 'server error' },
      status: 500,
      url: '/records',
    });
  });

  it('logs Axios network errors that do not include an HTTP response', () => {
    const { apiLog, service } = createService();
    const request = createRequestConfig();
    service.onRequest(request);
    const error = createAxiosError(request);

    expect(() => service.onResponseRejected(error)).not.toThrow();
    expect(service.pendingRequestCount).toBe(0);

    service.flushLog();

    const sentItems = getSentLogItems(apiLog);
    expect(JSON.parse(sentItems[1]?.detail)).toEqual({
      requestParams: { page: 1 },
      url: '/records',
    });
    expect(sentItems[1]?.duration).toBe(0);
  });

  it('logs Axios errors without request configuration', () => {
    const { apiLog, service } = createService();

    expect(() => service.onResponseRejected(createAxiosError())).not.toThrow();
    service.flushLog();

    const [errorLog] = getSentLogItems(apiLog);
    expect(errorLog.detail).toBe('{}');
    expect(errorLog.duration).toBeNull();
  });

  it('reports failed log uploads explicitly', async () => {
    const error = new Error('log endpoint unavailable');
    const { apiLog, service } = createService();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    apiLog.mockRejectedValueOnce(error);
    service.log([{ level: CommonDbLogLevel.ERROR, topic: 'test' }]);

    service.flushLog();
    await Promise.resolve();
    await Promise.resolve();

    expect(apiLog).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith('Failed to send logs', error);
  });
});
