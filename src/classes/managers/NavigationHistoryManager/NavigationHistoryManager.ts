import { WindowManager } from '../WindowManager';

export class NavigationHistoryManager {
  public readonly navigationHistory: string[] = [];

  private constructor() {
    //
  }

  public static get instance(): NavigationHistoryManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.navigationHistory = WindowManager.instance.window.managers.navigationHistory || new NavigationHistoryManager();
    return WindowManager.instance.window.managers.navigationHistory;
  }
}
