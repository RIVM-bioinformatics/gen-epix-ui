import { WindowManager } from '../WindowManager';

export class NavigationHistoryManager {
  public readonly navigationHistory: string[] = [];

  private constructor() {
    //
  }

  public static get instance(): NavigationHistoryManager {
    WindowManager.instance.window.managers.navigationHistory = WindowManager.instance.window.managers.navigationHistory || new NavigationHistoryManager();
    return WindowManager.instance.window.managers.navigationHistory;
  }
}
