import { WindowManager } from '../WindowManager';

export class UserSettingsManager {
  public showShowUserFeedbackTooltip = true;

  private constructor() {
    //
  }

  public static get instance(): UserSettingsManager {
    WindowManager.instance.window.managers.userSettings = WindowManager.instance.window.managers.userSettings || new UserSettingsManager();
    return WindowManager.instance.window.managers.userSettings;
  }
}
