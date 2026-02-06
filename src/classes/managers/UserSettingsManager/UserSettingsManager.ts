import { WindowManager } from '../WindowManager';

export class UserSettingsManager {
  public showShowUserFeedbackTooltip = true;

  private constructor() {
    //
  }

  public static get instance(): UserSettingsManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.userSettings = WindowManager.instance.window.managers.userSettings || new UserSettingsManager();
    return WindowManager.instance.window.managers.userSettings;
  }
}
