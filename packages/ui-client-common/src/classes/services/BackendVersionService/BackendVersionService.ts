import type { AxiosResponse } from 'axios';
import { singleton } from 'tsyringe';

@singleton()
export class BackendVersionService {
  public version: string = '-';

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    const contentType = response.headers['content-type'];
    const version = typeof contentType === 'string' ? contentType.split('version=')[1] : undefined;
    this.version = version || '-';
    return response;
  }
}
