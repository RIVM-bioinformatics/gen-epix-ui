import type { TFunction } from 'i18next';

export class TimeUtil {
  public static getReadableTimeRemaining(milliseconds: number, t: TFunction<'translation', undefined>, options: { postFix?: string; round?: boolean } = {}): string {
    const { postFix, round } = options;

    if (milliseconds < 1000) {
      return t(`less than a second${postFix ?? ''}`);
    }

    const hours = Math.floor(milliseconds / 3600000);
    const seconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      if (round) {
        return t(`more than {{hours}} hours${postFix ?? ''}`, { hours });
      }
      return t(`{{hours}} hours and {{minutes}} minutes${postFix ?? ''}`, { hours, minutes });
    }

    if (minutes === 0) {
      if (remainingSeconds < 10 && round) {
        return t(`a few seconds${postFix ?? ''}`);
      }
      if (remainingSeconds >= 10 && round) {
        return t(`less than a minute${postFix ?? ''}`);
      }
      return t(`{{remainingSeconds}} seconds${postFix ?? ''}`, { remainingSeconds });
    }

    if (remainingSeconds === 0 || round) {
      return t(`{{minutes}} minutes${postFix ?? ''}`, { minutes });
    }

    return t(`{{minutes}} minutes and {{remainingSeconds}} seconds${postFix ?? ''}`, { minutes, remainingSeconds });
  }
}
