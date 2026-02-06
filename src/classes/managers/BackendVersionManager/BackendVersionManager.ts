import type { AxiosResponse } from 'axios';

import { WindowManager } from '../WindowManager';

export class BackendVersionManager {
  public version: string;

  private constructor() {
    //
  }

  public static get instance(): BackendVersionManager {
    WindowManager.instance.window.managers.backendVersion = WindowManager.instance.window.managers.backendVersion || new BackendVersionManager();
    return WindowManager.instance.window.managers.backendVersion;
  }

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    this.version = (response.headers['content-type'] as string).split('version=')?.[1] ?? '-';
    return response;
  }
}
