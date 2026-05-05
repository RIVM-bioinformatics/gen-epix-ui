import type { CommonDbUser } from '@gen-epix/api-commondb';
import type { TFunction } from 'i18next';

export class CommonDataUtil {

  public static getUserDisplayValue(user: CommonDbUser, t: TFunction<'translation', undefined>): string {
    if (!user) {
      return t`Unknown user`;
    }
    return `${user.name} (${user.key})`;
  }

  public static rankSortComperatorFactory<TSecondarySorKey extends keyof TItem, TItem extends { rank?: number }>(secondarySortKeyOrFn?: ((item: TItem) => string) | TSecondarySorKey) {
    return (a: TItem, b: TItem): number => {
      const rankComparison = (a.rank ?? 0) - (b.rank ?? 0);
      if (rankComparison !== 0 || !secondarySortKeyOrFn) {
        return rankComparison;
      }
      let aSecondary: unknown;
      let bSecondary: unknown;
      if (typeof secondarySortKeyOrFn === 'function') {
        aSecondary = secondarySortKeyOrFn(a);
        bSecondary = secondarySortKeyOrFn(b);
      } else {
        aSecondary = a[secondarySortKeyOrFn];
        bSecondary = b[secondarySortKeyOrFn];
      }
      if (aSecondary === bSecondary) {
        return 0;
      }
      if (aSecondary === undefined || aSecondary === null) {
        return -1;
      }
      if (bSecondary === undefined || bSecondary === null) {
        return 1;
      }
      if (typeof aSecondary === 'string' && typeof bSecondary === 'string') {
        return aSecondary.localeCompare(bSecondary);
      }
      if (typeof aSecondary === 'number' && typeof bSecondary === 'number') {
        return aSecondary - bSecondary;
      }
      return 0;
    };
  }
}
