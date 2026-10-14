import { singleton } from 'tsyringe';

@singleton()
export class UserSettingsService {
  public showShowUserFeedbackTooltip = true;

}
