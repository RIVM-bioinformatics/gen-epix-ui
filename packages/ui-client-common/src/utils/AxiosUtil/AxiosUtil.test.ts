import {
  describe,
  expect,
  it,
} from 'vitest';
import type { AxiosError } from 'axios';
import { CanceledError } from 'axios';
import type { DeepPartial } from 'react-hook-form';

import { AxiosUtil } from './AxiosUtil';

describe('AxiosUtil', () => {
  const createAxiosError = (status: number | undefined, code?: string): DeepPartial<AxiosError> => ({
    code,
    config: {},
    isAxiosError: true,
    message: '',
    name: '',
    response: status === undefined ? undefined : { status },
    toJSON: () => ({}),
  });

  it('should identify a canceled error', () => {
    const error = new CanceledError();
    expect(AxiosUtil.isAxiosCanceledError(error)).toBe(true);
    expect(AxiosUtil.isAxiosCanceledError(new Error('not canceled'))).toBe(false);
  });

  it('should identify an unauthorized error', () => {
    const error = createAxiosError(401);
    expect(AxiosUtil.isAxiosUnauthorizedError(error)).toBe(true);
  });

  it('should identify a forbidden error', () => {
    const error = createAxiosError(403);
    expect(AxiosUtil.isAxiosForbiddenError(error)).toBe(true);
  });

  it('should identify a conflict error', () => {
    const error = createAxiosError(409);
    expect(AxiosUtil.isAxiosConflictError(error)).toBe(true);
  });

  it('should identify an unprocessable entity error', () => {
    const error = createAxiosError(422);
    expect(AxiosUtil.isAxiosUnprocessableEntityError(error)).toBe(true);
  });

  it('should identify a not found error', () => {
    const error = createAxiosError(404);
    expect(AxiosUtil.isAxiosNotFoundError(error)).toBe(true);
  });

  it('should identify a bad request error', () => {
    const error = createAxiosError(400);
    expect(AxiosUtil.isAxiosBadRequestError(error)).toBe(true);
  });

  it('should identify an internal server error', () => {
    const error = createAxiosError(500);
    expect(AxiosUtil.isAxiosInternalServerError(error)).toBe(true);
  });

  it('should not identify an error with a different status code', () => {
    const error = createAxiosError(418); // I'm a teapot
    expect(AxiosUtil.isAxiosUnauthorizedError(error)).toBe(false);
    expect(AxiosUtil.isAxiosForbiddenError(error)).toBe(false);
    expect(AxiosUtil.isAxiosUnprocessableEntityError(error)).toBe(false);
    expect(AxiosUtil.isAxiosNotFoundError(error)).toBe(false);
    expect(AxiosUtil.isAxiosBadRequestError(error)).toBe(false);
    expect(AxiosUtil.isAxiosInternalServerError(error)).toBe(false);
    expect(AxiosUtil.isAxiosConflictError(error)).toBe(false);
  });

  it('should only identify Axios request errors with the requested response status', () => {
    expect(AxiosUtil.isAxiosRequestErrorWithCode(createAxiosError(409), 409)).toBe(true);
    expect(AxiosUtil.isAxiosRequestErrorWithCode(createAxiosError(409), 404)).toBe(false);
    expect(AxiosUtil.isAxiosRequestErrorWithCode(createAxiosError(undefined), 404)).toBe(false);
    expect(AxiosUtil.isAxiosRequestErrorWithCode({
      isAxiosError: false,
      response: { status: 404 },
    }, 404)).toBe(false);
  });

  it('should identify timeout errors but not cancellations or other error codes', () => {
    expect(AxiosUtil.isAxiosTimeoutError(createAxiosError(500, 'ECONNABORTED'))).toBe(true);
    expect(AxiosUtil.isAxiosTimeoutError(createAxiosError(500, 'ETIMEDOUT'))).toBe(false);
    expect(AxiosUtil.isAxiosTimeoutError(new CanceledError())).toBe(false);
    expect(AxiosUtil.isAxiosTimeoutError({
      code: 'ECONNABORTED',
      isAxiosError: false,
    })).toBe(false);
  });
});
