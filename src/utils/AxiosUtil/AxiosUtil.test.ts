import {
  describe,
  it,
  expect,
} from 'vitest';
import type { AxiosError } from 'axios';
import { CanceledError } from 'axios';
import type { DeepPartial } from 'react-hook-form';

import { AxiosUtil } from './AxiosUtil';

describe('AxiosUtil', () => {
  const createAxiosError = (status: number): DeepPartial<AxiosError> => ({
    isAxiosError: true,
    response: { status },
    config: {},
    name: '',
    message: '',
    toJSON: () => ({}),
  });

  it('should identify a canceled error', () => {
    const error = new CanceledError();
    expect(AxiosUtil.isAxiosCanceledError(error)).toBe(true);
  });

  it('should identify an unauthorized error', () => {
    const error = createAxiosError(401);
    expect(AxiosUtil.isAxiosUnauthorizedError(error)).toBe(true);
  });

  it('should identify a forbidden error', () => {
    const error = createAxiosError(403);
    expect(AxiosUtil.isAxiosForbiddenError(error)).toBe(true);
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
  });
});
