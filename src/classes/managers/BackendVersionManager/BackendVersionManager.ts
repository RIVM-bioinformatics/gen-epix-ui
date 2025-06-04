import type { AxiosResponse } from 'axios';

export class BackendVersionManager {
  public version: string;
  private static __instance: BackendVersionManager;

  public static get instance(): BackendVersionManager {
    BackendVersionManager.__instance = BackendVersionManager.__instance || new BackendVersionManager();
    return BackendVersionManager.__instance;
  }

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    this.version = (response.headers['content-type'] as string).split('version=')?.[1] ?? '-';
    return response;
  }
}
