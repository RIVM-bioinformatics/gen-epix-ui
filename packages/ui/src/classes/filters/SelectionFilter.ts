import { t } from 'i18next';
import type { CommonDbFiltersInner } from '@gen-epix/api-commondb';

import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter';

export class SelectionFilter extends FilterAbstract<string[]> implements Filter<string[], string> {
  public filterValue: string[] = [];
  public initialFilterValue: string[] = [];

  public getPresentationValue(): string {
    return t('{{numCases}} case(s)', { numCases: this.filterValue.length });
  }

  public matchRowValue(_rowValue: unknown): boolean {
    // ! FIXME
    return !this.filterValue.length;
  }

  public toBackendFilter(): CommonDbFiltersInner {
    return undefined;
  }
}
