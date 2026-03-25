import type { AxiosResponse } from 'axios';

import { WindowManager } from '../WindowManager';

export class BackendVersionManager {
  public version: string;

  private constructor() {
    //
  }

  public static get instance(): BackendVersionManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.backendVersion = WindowManager.instance.window.managers.backendVersion || new BackendVersionManager();
    return WindowManager.instance.window.managers.backendVersion;
  }

  public onResponseFulfilled(response: AxiosResponse): AxiosResponse {
    this.version = (response.headers['content-type'] as string).split('version=')?.[1] ?? '-';
    return response;
  }
}
