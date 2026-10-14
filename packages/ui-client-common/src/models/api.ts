import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  CommonDbAbacApi,
  CommonDbAuthApi,
  CommonDbOrganizationApi,
  CommonDbSystemApi,
} from '@gen-epix/api-commondb';
import type { InjectionToken } from 'tsyringe';

export interface BaseApi {
  accessToken: string;
  baseUrl: string;
  defaultRequestTimeout: number;
  onRequest: Array<(request: InternalAxiosRequestConfig) => InternalAxiosRequestConfig<unknown>>;
  onResponseFulfilled: Array<(response: AxiosResponse) => AxiosResponse>;
  onResponseRejected: Array<(error: unknown) => void>;
}

export const API_BASE_TOKEN: InjectionToken<BaseApi> = Symbol('API_BASE_TOKEN');
export const API_ABAC_TOKEN: InjectionToken<CommonDbAbacApi> = Symbol('API_ABAC_TOKEN');
export const API_AUTH_TOKEN: InjectionToken<CommonDbAuthApi> = Symbol('API_AUTH_TOKEN');
export const API_ORGANIZATION_TOKEN: InjectionToken<CommonDbOrganizationApi> = Symbol('API_ORGANIZATION_TOKEN');
export const API_SYSTEM_TOKEN: InjectionToken<CommonDbSystemApi> = Symbol('API_SYSTEM_TOKEN');
