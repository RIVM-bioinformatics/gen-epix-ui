import type { AxiosError } from 'axios';
import {
  CanceledError,
  isAxiosError,
} from 'axios';

export class AxiosUtil {
  public static isAxiosTimeoutError(error: unknown): error is AxiosError<unknown> {
    return isAxiosError(error) && !AxiosUtil.isAxiosCanceledError(error) && error.code === 'ECONNABORTED';
  }

  public static isAxiosCanceledError(error: unknown): error is CanceledError<unknown> {
    return error instanceof CanceledError;
  }

  public static isAxiosUnauthorizedError(error: unknown): error is AxiosError<unknown> {
    return AxiosUtil.isAxiosRequestErrorWithCode(error, 401);
  }

  public static isAxiosForbiddenError(error: unknown): error is AxiosError<unknown> {
    return AxiosUtil.isAxiosRequestErrorWithCode(error, 403);
  }

  public static isAxiosUnprocessableEntityError(error: unknown): error is AxiosError<unknown> {
    return AxiosUtil.isAxiosRequestErrorWithCode(error, 422);
  }

  public static isAxiosNotFoundError(error: unknown): error is AxiosError<unknown> {
    return AxiosUtil.isAxiosRequestErrorWithCode(error, 404);
  }

  public static isAxiosBadRequestError(error: unknown): error is AxiosError<unknown> {
    return AxiosUtil.isAxiosRequestErrorWithCode(error, 400);
  }

  public static isAxiosInternalServerError(error: unknown): error is AxiosError<unknown> {
    return AxiosUtil.isAxiosRequestErrorWithCode(error, 500);
  }

  public static isAxiosRequestErrorWithCode(error: unknown, status: number): error is AxiosError<unknown> {
    return isAxiosError(error) && error.response?.status === status;
  }
}
