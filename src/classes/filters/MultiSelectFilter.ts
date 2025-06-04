import intersection from 'lodash/intersection';
import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';

import type { TypedStringSetFilter } from '../../api';
import type { AutoCompleteOption } from '../../models/form';
import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter';

export interface MultiSelectFilterKwArgs extends FilterAbstractKwArgs {
  options: AutoCompleteOption[];
  maxNumOptionsExpanded?: number;
}

export class MultiSelectFilter extends FilterAbstract<string[]> implements Filter<string[], string> {
  public options: AutoCompleteOption[];
  private readonly optionsMap: Map<string, string> = new Map<string, string>();
  public initialFilterValue: string[] = [];
  public filterValue: string[] = [];
  public maxNumOptionsExpanded = 5;

  public constructor(kwArgs: MultiSelectFilterKwArgs) {
    super({
      id: kwArgs.id,
      label: kwArgs.label,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      filterDimensionId: kwArgs.filterDimensionId,
    });
    this.options = kwArgs.options;
    if (isNumber(kwArgs.maxNumOptionsExpanded)) {
      this.maxNumOptionsExpanded = kwArgs.maxNumOptionsExpanded;
    }
    kwArgs.options.forEach(option => {
      this.optionsMap.set(option.value as string, option.label);
    });
  }

  public matchRowValue(rowValue: string): boolean {
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

  public getPresentationValue(value?: unknown): string {
    const usedValues = value as string[] ?? this.filterValue;
    return usedValues.map(v => this.optionsMap.get(v)).join(', ');
  }

  public toBackendFilter(): TypedStringSetFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    return {
      type: 'STRING_SET',
      key: this.id,
      members: this.filterValue,
    };
  }
}
