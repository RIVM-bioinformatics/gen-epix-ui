import { HmrUtil } from '../../../utils/HmrUtil';

export class UserSettingsService {
  private static __instance: UserSettingsService;

  public showShowUserFeedbackTooltip = true;

  private constructor() {
    //
  }

  public static getInstance(): UserSettingsService {
    UserSettingsService.__instance = HmrUtil.getHmrSingleton('userSettingsService', UserSettingsService.__instance, () => new UserSettingsService());
    return UserSettingsService.__instance;
  }
}
