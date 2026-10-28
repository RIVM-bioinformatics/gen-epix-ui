import {
  format,
  isAfter,
  isBefore,
  isDate,
  isEqual,
  isValid,
} from 'date-fns';
import type {
  CommonDbDateRangeFilter,
  CommonDbPartialDateRangeFilter,
} from '@gen-epix/api-commondb';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';

import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter.models';

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
  public override supportsMissingValuesFilter = true;

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
      const parsedValue = this.parseFilterValueFromURLSearchParameterValue(searchParameterValue);
      if (!Array.isArray(parsedValue)) {
        throw new TypeError('Date filter URL value must be an array.');
      }

      const sanitizedValue = parsedValue.map(value => {
        if (typeof value !== 'string' || !value) {
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
    return isBefore(rowDateValue, right) || isEqual(rowDateValue, right);
  }

  public toBackendFilter(): CommonDbDateRangeFilter | CommonDbPartialDateRangeFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    const lowerBound = this.filterValue[0];
    const upperBound = this.filterValue[1];
    const hasValidLowerBound = isDate(lowerBound) && isValid(lowerBound);
    const hasValidUpperBound = isDate(upperBound) && isValid(upperBound);

    return {
      key: this.id,
      lower_bound: hasValidLowerBound ? format(lowerBound, DATE_FORMAT.DATE) : undefined,
      lower_bound_censor: hasValidLowerBound ? '>=' : undefined,
      type: this.backendFilterType,
      upper_bound: hasValidUpperBound ? format(upperBound, DATE_FORMAT.DATE) : undefined,
      upper_bound_censor: hasValidUpperBound ? '<=' : undefined,
    };
  }
}
