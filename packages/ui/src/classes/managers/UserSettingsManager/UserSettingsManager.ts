import { HmrUtil } from '../../../utils/HmrUtil';

export class UserSettingsManager {
  public static get instance(): UserSettingsManager {
    UserSettingsManager.__instance = HmrUtil.getHmrSingleton('userSettingsManager', UserSettingsManager.__instance, () => new UserSettingsManager());
    return UserSettingsManager.__instance;
  }

  private static __instance: UserSettingsManager;

  public showShowUserFeedbackTooltip = true;

  private constructor() {
    //
  }
}
