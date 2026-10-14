import {
  container as rootContainer,
  singleton,
} from 'tsyringe';

@singleton()
export class UserSettingsService {
  public showShowUserFeedbackTooltip = true;

  public static getInstance(): UserSettingsService {
    return rootContainer.resolve(UserSettingsService);
  }
}
