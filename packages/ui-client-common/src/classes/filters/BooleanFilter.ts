import type { TFunction } from 'i18next';
import type { CommonDbFiltersInner } from '@gen-epix/api-commondb';

import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter.models';

export class BooleanFilter extends FilterAbstract<boolean> implements Filter<boolean, boolean> {
  public filterValue: boolean = null;
  public initialFilterValue: boolean = null;
  public override supportsMissingValuesFilter = true;

  public getPresentationValue(value?: unknown, t?: TFunction<'translation', undefined>): string {
    const usedValue = value as string ?? this.filterValue;
    if (usedValue) {
      return t ? t('Yes') : 'Yes';
    }
    return t ? t('No') : 'No';
  }

  public matchRowValue(rowValue: boolean): boolean {
    if (this.filterValue === null || this.filterValue === undefined) {
      return true;
    }

    if (rowValue === null || rowValue === undefined) {
      return false;
    }

    return rowValue === this.filterValue;
  }

  public toBackendFilter(): CommonDbFiltersInner {
    throw new Error('Not implemented');
  }
}
