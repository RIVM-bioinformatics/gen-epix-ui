import type { AxiosResponse } from 'axios';

import { HmrUtil } from '../../../utils/HmrUtil';

export class BackendVersionService {
  private static __instance: BackendVersionService;

  public version: string;

  private constructor() {
    //
  }

  public static getInstance(): BackendVersionService {
    BackendVersionService.__instance = HmrUtil.getHmrSingleton('backendVersionService', BackendVersionService.__instance, () => new BackendVersionService());
    return BackendVersionService.__instance;
  }

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    this.version = (response.headers['content-type'] as string).split('version=')?.[1] ?? '-';
    return response;
  }
}
