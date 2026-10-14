import type { AxiosResponse } from 'axios';
import { singleton } from 'tsyringe';

@singleton()
export class BackendVersionService {
  public version: string;


  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    this.version = (response.headers['content-type'] as string).split('version=')?.[1] ?? '-';
    return response;
  }
}
