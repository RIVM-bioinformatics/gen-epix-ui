export class UserSettingsManager {
  private static __instance: UserSettingsManager;
  public showShowUserFeedbackTooltip = true;

  public static get instance(): UserSettingsManager {
    UserSettingsManager.__instance = UserSettingsManager.__instance || new UserSettingsManager();
    return UserSettingsManager.__instance;
  }
}
