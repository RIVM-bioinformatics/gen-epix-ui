import {
  format,
  isAfter,
  isBefore,
  isDate,
  isEqual,
} from 'date-fns';

import type {
  TypedDateRangeFilter,
  TypedPartialDateRangeFilter,
} from '../../api';
import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter';

export interface DateFilterKwArgs extends FilterAbstractKwArgs {
  dateParser: (date: string) => Date;
  minDate: Date;
  maxDate: Date;
  backendFilterType?: 'DATE_RANGE' | 'PARTIAL_DATE_RANGE';
}

export class DateFilter extends FilterAbstract<[Date, Date]> implements Filter<[Date, Date], string> {
  public minDate: Date;
  public maxDate: Date;
  public initialFilterValue: [Date, Date] = [null, null];
  public filterValue: [Date, Date] = [null, null];
  public dateParser: (date: string) => Date;
  public backendFilterType: 'DATE_RANGE' | 'PARTIAL_DATE_RANGE';

  public constructor(kwArgs: DateFilterKwArgs) {
    super({
      id: kwArgs.id,
      label: kwArgs.label,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      filterDimensionId: kwArgs.filterDimensionId,
    });
    this.minDate = kwArgs.minDate;
    this.maxDate = kwArgs.maxDate;
    this.dateParser = kwArgs.dateParser;
    this.backendFilterType = kwArgs.backendFilterType ?? 'DATE_RANGE';
  }

  public matchRowValue(rowValue: string): boolean {
    if (!this.filterValue) {
      return true;
    }
    const left = this.filterValue[0];
    const right = this.filterValue[1];

    if (!isDate(left) && !isDate(right)) {
      return true;
    }
    if (!rowValue) { // empty string
      return false;
    }
    const rowDateValue = this.dateParser(rowValue);

    if (isDate(left) && isDate(right)) {
      return (isAfter(rowDateValue, left) || isEqual(rowDateValue, left)) && (isBefore(rowDateValue, right) || isEqual(rowDateValue, right));
    }
    if (isDate(left)) {
      return isAfter(rowDateValue, left) || isEqual(rowDateValue, left);
    }
    if (isDate(right)) {
      return isBefore(rowDateValue, right) || isEqual(rowDateValue, right);
    }
  }

  public getPresentationValue(value?: unknown): string {
    const usedValue = value as [Date, Date] ?? this.filterValue;

    return `${usedValue[0] ? format(usedValue[0], 'yyyy-MM-dd') : '...'} - ${usedValue[1] ? format(usedValue[1], 'yyyy-MM-dd') : '...'}`;
  }

  public toBackendFilter(): TypedDateRangeFilter | TypedPartialDateRangeFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    return {
      key: this.id,
      type: this.backendFilterType,
      lower_bound: this.filterValue[0] ? format(this.filterValue[0], 'yyyy-MM-dd') : undefined,
      upper_bound: this.filterValue[1] ? format(this.filterValue[1], 'yyyy-MM-dd') : undefined,
      lower_bound_censor: '>=',
      upper_bound_censor: '<=',
    };
  }
}
