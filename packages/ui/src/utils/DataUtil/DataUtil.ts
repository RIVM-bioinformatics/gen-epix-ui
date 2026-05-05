import type { CommonDbUser } from '@gen-epix/api-commondb';
import type { TFunction } from 'i18next';

export class DataUtil {

  public static getUserDisplayValue(user: CommonDbUser, t: TFunction<'translation', undefined>): string {
    if (!user) {
      return t`Unknown user`;
    }
    return `${user.name} (${user.key})`;
  }

}
