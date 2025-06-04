import type { TFunction } from 'i18next';

import type { TypedExistsFilter } from '../../api';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter';

export class BooleanFilter extends FilterAbstract<boolean> implements Filter<boolean, boolean> {
  public initialFilterValue: boolean = null;
  public filterValue: boolean = null;

  public matchRowValue(rowValue: boolean): boolean {
    if (this.filterValue === null || this.filterValue === undefined) {
      return true;
    }

    if (rowValue === null || rowValue === undefined) {
      return false;
    }

    return rowValue === this.filterValue;
  }

  public getPresentationValue(value?: unknown, t?: TFunction<'translation', undefined>): string {
    const usedValue = value as string ?? this.filterValue;
    return usedValue ? t('Yes') : t('No');
  }

  public toBackendFilter(): TypedExistsFilter {
    throw new Error('Not implemented');
  }
}
