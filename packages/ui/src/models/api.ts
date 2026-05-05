import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

export interface Api {
  accessToken: string;
  baseUrl: string;
  defaultRequestTimeout: number;
  onRequest: Array<(request: InternalAxiosRequestConfig) => InternalAxiosRequestConfig<unknown>>;
  onResponseFulfilled: Array<(response: AxiosResponse) => AxiosResponse>;
  onResponseRejected: Array<(error: unknown) => void>;
}
