import {
  format,
  isAfter,
  isBefore,
  isDate,
  isEqual,
  isValid,
} from 'date-fns';
import type {
  CommonDbTypedDateRangeFilter,
  CommonDbTypedPartialDateRangeFilter,
} from '@gen-epix/api-commondb';

import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter';
import { DATE_FORMAT } from '../../data/date';

export interface DateFilterKwArgs extends FilterAbstractKwArgs {
  backendFilterType?: 'DATE_RANGE' | 'PARTIAL_DATE_RANGE';
  dateFormat?: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  dateParser: (date: string) => Date;
  maxDate: Date;
  minDate: Date;
}

export class DateFilter extends FilterAbstract<[Date, Date]> implements Filter<[Date, Date], string> {
  public backendFilterType: 'DATE_RANGE' | 'PARTIAL_DATE_RANGE';
  public dateFormat: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  public dateParser: (date: string) => Date;
  public filterValue: [Date, Date] = [null, null];
  public initialFilterValue: [Date, Date] = [null, null];
  public maxDate: Date;
  public minDate: Date;

  public constructor(kwArgs: DateFilterKwArgs) {
    super({
      filterDimensionId: kwArgs.filterDimensionId,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      id: kwArgs.id,
      label: kwArgs.label,
    });
    this.minDate = kwArgs.minDate;
    this.maxDate = kwArgs.maxDate;
    this.dateParser = kwArgs.dateParser;
    this.dateFormat = kwArgs.dateFormat ?? DATE_FORMAT.DATE;
    this.backendFilterType = kwArgs.backendFilterType ?? 'DATE_RANGE';
  }

  public fromURLSearchParameterValue(searchParameterValue: string): [Date, Date] {
    try {
      const sanitizedValue = (JSON.parse(searchParameterValue) as string[]).map(value => {
        if (!value) {
          return null;
        }
        const date = this.dateParser(value);
        return isDate(date) && isValid(date) ? date : null;
      });
      if (sanitizedValue.length !== 2) {
        return [null, null];
      }
      return sanitizedValue as [Date, Date];
    } catch (error) {
      console.error(`Error parsing search parameter value for label ${this.label} and value ${searchParameterValue}`, error);
      return [null, null];
    }
  }

  public getPresentationValue(value?: unknown): string {
    const usedValue = value as [Date, Date] ?? this.filterValue;

    let left: string;
    let right: string;
    try {
      left = usedValue[0] ? format(usedValue[0], this.dateFormat) : '...';
    } catch (_e: unknown) {
      left = '...';
    }
    try {
      right = usedValue[1] ? format(usedValue[1], this.dateFormat) : '...';
    } catch (_e: unknown) {
      right = '...';
    }

    return `${left} - ${right}`;
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

  public toBackendFilter(): CommonDbTypedDateRangeFilter | CommonDbTypedPartialDateRangeFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    return {
      key: this.id,
      lower_bound: this.filterValue[0] && isDate(this.filterValue[0]) ? format(this.filterValue[0], DATE_FORMAT.DATE) : undefined,
      lower_bound_censor: this.filterValue[0] ? '>=' : undefined,
      type: this.backendFilterType,
      upper_bound: this.filterValue[1] && isDate(this.filterValue[1]) ? format(this.filterValue[1], DATE_FORMAT.DATE) : undefined,
      upper_bound_censor: this.filterValue[1] ? '<=' : undefined,
    };
  }

  public toURLSearchParameterValue(): string {
    return JSON.stringify(this.filterValue);
  }
}
