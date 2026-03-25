import { t } from 'i18next';

export class TimeUtil {
  public static getReadableTimeRemaining(milliseconds: number, round = false): string {

    if (milliseconds < 1000) {
      return t('less than a second');
    }

    const hours = Math.floor(milliseconds / 3600000);
    const seconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      if (round) {
        return t('more than {{hours}} hours', { hours });
      }
      return t('{{hours}} hours and {{minutes}} minutes', { hours, minutes });
    }

    if (minutes === 0) {
      if (remainingSeconds < 10 && round) {
        return t('a few seconds');
      }
      if (remainingSeconds >= 10 && round) {
        return t('less than a minute');
      }
      return t('{{seconds}} seconds', { seconds: remainingSeconds });
    }

    if (remainingSeconds === 0 || round) {
      return t('{{minutes}} minutes', { minutes });
    }

    return t('{{minutes}} minutes and {{seconds}} seconds', { minutes, seconds: remainingSeconds });
  }
}
