import {
  describe,
  expect,
  it,
} from 'vitest';
import { AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';

import { BackendVersionService } from './BackendVersionService';

const createResponse = (contentType?: string): AxiosResponse => ({
  config: {
    headers: new AxiosHeaders(),
  },
  data: {},
  headers: contentType
    ? new AxiosHeaders({ 'content-type': contentType })
    : new AxiosHeaders(),
  status: 200,
  statusText: 'OK',
});

describe('BackendVersionService', () => {
  it('starts with an unavailable version marker', () => {
    expect(new BackendVersionService().version).toBe('-');
  });

  it('extracts the version from a response content type and returns the same response', () => {
    const service = new BackendVersionService();
    const response = createResponse('application/json; version=3.2.1');

    expect(service.onResponseFulfilled(response)).toBe(response);
    expect(service.version).toBe('3.2.1');
  });

  it.each([
    undefined,
    'application/json',
    'application/json; version=',
  ])('uses the unavailable marker when version metadata is %j', (contentType) => {
    const service = new BackendVersionService();
    const response = createResponse(contentType);

    service.onResponseFulfilled(response);

    expect(service.version).toBe('-');
  });
});
