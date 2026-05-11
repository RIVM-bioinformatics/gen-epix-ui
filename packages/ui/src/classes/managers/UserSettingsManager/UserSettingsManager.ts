import { HmrUtil } from '../../../utils/HmrUtil';

export class UserSettingsManager {
  private static __instance: UserSettingsManager;

  public showShowUserFeedbackTooltip = true;

  private constructor() {
    //
  }

  public static getInstance(): UserSettingsManager {
    UserSettingsManager.__instance = HmrUtil.getHmrSingleton('userSettingsManager', UserSettingsManager.__instance, () => new UserSettingsManager());
    return UserSettingsManager.__instance;
  }
}
