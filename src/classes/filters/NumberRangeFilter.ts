import isFinite from 'lodash/isFinite';

import type { TypedNumberRangeFilter } from '../../api';
import { ComparisonOperator } from '../../api';
import type { Filter } from '../../models/filter';
import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';

export interface NumberRangeFilterKwArgs extends FilterAbstractKwArgs {
  min: number;
  max: number;
}

export class NumberRangeFilter extends FilterAbstract<[number, number]> implements Filter<[number, number], number> {
  public min: number;
  public max: number;
  public initialFilterValue: [number, number] = [null, null];
  public filterValue: [number, number] = [null, null];

  public constructor(kwArgs: NumberRangeFilterKwArgs) {
    super({
      id: kwArgs.id,
      label: kwArgs.label,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      filterDimensionId: kwArgs.filterDimensionId,
    });
    this.min = kwArgs.min;
    this.max = kwArgs.max;
  }

  public getPresentationValue(value?: unknown): string {
    const usedValue = value as [number, number] ?? this.filterValue;
    const left = isFinite(usedValue[0]) ? `[${usedValue[0]}` : '';
    const middle = usedValue.every(isFinite) ? ',' : '';
    const right = isFinite(usedValue[1]) ? `${usedValue[1]}[` : '';

    return `${left}${middle}${right}`;
  }

  public matchRowValue(rowValue: number): boolean {
    if (!this.filterValue) {
      return true;
    }

    if (!isFinite(rowValue)) {
      return false;
    }

    const left = this.filterValue[0];
    const right = this.filterValue[1];

    if (isFinite(left) && +rowValue < this.filterValue[0]) {
      return false;
    }
    if (isFinite(right) && +rowValue > this.filterValue[1]) {
      return false;
    }
    return true;
  }

  public toBackendFilter(): TypedNumberRangeFilter {
    if (this.isInitialFilterValue()) {
      return;
    }
    let upper_bound_censor: ComparisonOperator;
    if (this.filterValue[0] === this.filterValue[1]) {
      upper_bound_censor = ComparisonOperator.Less_Than_Or_Equal_To;
    } else if (isFinite(this.filterValue[1])) {
      upper_bound_censor = ComparisonOperator.Less_Than;
    }

    return {
      type: 'NUMBER_RANGE',
      key: this.id,
      lower_bound: this.filterValue[0] ?? undefined,
      upper_bound: this.filterValue[1] ?? undefined,
      lower_bound_censor: isFinite(this.filterValue[0]) ? ComparisonOperator.Greater_Than_Or_Equal_To : undefined,
      upper_bound_censor,
    };
  }
}
