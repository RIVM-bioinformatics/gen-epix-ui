import type { AxiosResponse } from 'axios';
import {
  container as rootContainer,
  singleton,
} from 'tsyringe';

@singleton()
export class BackendVersionService {
  public version: string;

  public static getInstance(): BackendVersionService {
    return rootContainer.resolve(BackendVersionService);
  }

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    this.version = (response.headers['content-type'] as string).split('version=')?.[1] ?? '-';
    return response;
  }
}
