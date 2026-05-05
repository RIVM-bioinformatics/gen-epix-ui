import type { CommonDbTypedRegexFilter } from '@gen-epix/api-commondb';

import type { Filter } from '../../models/filter';
import { FilterAbstract } from '../abstracts/FilterAbstract';

export class TextFilter extends FilterAbstract<string> implements Filter<string, string> {
  public filterValue: string = '';
  public initialFilterValue: string = '';

  public getPresentationValue(value?: unknown): string {
    const usedValue = value as string ?? this.filterValue;
    return usedValue ?? '';
  }

  public matchRowValue(rowValue: string): boolean {
    if (!this.filterValue) {
      return true;
    }

    if (!rowValue) {
      return false;
    }
    return String(rowValue).toLocaleLowerCase().includes(String(this.filterValue).toLocaleLowerCase());
  }

  public toBackendFilter(): CommonDbTypedRegexFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    return {
      key: this.id,
      pattern: `.*${this.filterValue}.*`,
      type: 'REGEX',
    };
  }
}
