import intersection from 'lodash/intersection';
import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import type {
  CommonDbNumberSetFilter,
  CommonDbStringSetFilter,
} from '@gen-epix/api-commondb';
import type { AutoCompleteOption } from '@gen-epix/ui-core-form/models/form.models';

import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter.models';

export interface MultiSelectFilterKwArgs extends FilterAbstractKwArgs {
  maxNumOptionsExpanded?: number;
  options: AutoCompleteOption[];
}

type MultiSelectOptionValue = number | string;

export class MultiSelectFilter extends FilterAbstract<MultiSelectOptionValue[]> implements Filter<MultiSelectOptionValue[], MultiSelectOptionValue | MultiSelectOptionValue[]> {
  public filterValue: MultiSelectOptionValue[] = [];
  public initialFilterValue: MultiSelectOptionValue[] = [];
  public maxNumOptionsExpanded = 5;
  public options: AutoCompleteOption[];
  public override supportsMissingValuesFilter = true;
  private readonly optionsMap: Map<MultiSelectOptionValue, string> = new Map<MultiSelectOptionValue, string>();

  public constructor(kwArgs: MultiSelectFilterKwArgs) {
    super({
      filterDimensionId: kwArgs.filterDimensionId,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      id: kwArgs.id,
      label: kwArgs.label,
    });
    this.options = kwArgs.options;
    if (isNumber(kwArgs.maxNumOptionsExpanded) && !Number.isNaN(kwArgs.maxNumOptionsExpanded)) {
      this.maxNumOptionsExpanded = kwArgs.maxNumOptionsExpanded;
    }
    kwArgs.options.forEach(option => {
      if (option.value !== undefined) {
        this.optionsMap.set(option.value, option.label ?? '');
      }
    });
  }

  public getPresentationValue(value?: unknown): string {
    const usedValues = value as MultiSelectOptionValue[] ?? this.filterValue;
    return usedValues.map(v => this.optionsMap.get(v)).join(', ');
  }

  public matchRowValue(rowValue: MultiSelectOptionValue | MultiSelectOptionValue[]): boolean {
    if (!this.filterValue) {
      return true;
    }

    if (!this.filterValue || !isArray(this.filterValue) || this.filterValue.length === 0) {
      return true;
    }
    if (isArray(rowValue)) {
      return intersection(rowValue, this.filterValue).length > 0;
    }
    return (this.filterValue).includes(rowValue);
  }

  public toBackendFilter(): CommonDbNumberSetFilter | CommonDbStringSetFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    const numberValues = this.filterValue.filter((value): value is number => typeof value === 'number');
    if (numberValues.length === this.filterValue.length) {
      return {
        key: this.id,
        members: numberValues,
        type: 'NUMBER_SET',
      };
    }

    const stringValues = this.filterValue.filter((value): value is string => typeof value === 'string');
    if (stringValues.length === this.filterValue.length) {
      return {
        key: this.id,
        members: stringValues,
        type: 'STRING_SET',
      };
    }

    throw new TypeError('A multi-select filter cannot mix string and number values.');
  }
}
