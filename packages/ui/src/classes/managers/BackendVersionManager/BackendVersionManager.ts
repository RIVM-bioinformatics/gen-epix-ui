import type { AxiosResponse } from 'axios';

import { HmrUtil } from '../../../utils/HmrUtil';

export class BackendVersionManager {
  public static get instance(): BackendVersionManager {
    BackendVersionManager.__instance = HmrUtil.getHmrSingleton('backendVersionManager', BackendVersionManager.__instance, () => new BackendVersionManager());
    return BackendVersionManager.__instance;
  }

  private static __instance: BackendVersionManager;

  public version: string;

  private constructor() {
    //
  }

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    this.version = (response.headers['content-type'] as string).split('version=')?.[1] ?? '-';
    return response;
  }
}
