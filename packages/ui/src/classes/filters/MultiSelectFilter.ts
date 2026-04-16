import intersection from 'lodash/intersection';
import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import type { CaseDbTypedStringSetFilter } from '@gen-epix/api-casedb';

import type { AutoCompleteOption } from '../../models/form';
import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { Filter } from '../../models/filter';

export interface MultiSelectFilterKwArgs extends FilterAbstractKwArgs {
  maxNumOptionsExpanded?: number;
  options: AutoCompleteOption[];
}

export class MultiSelectFilter extends FilterAbstract<string[]> implements Filter<string[], string> {
  public filterValue: string[] = [];
  public initialFilterValue: string[] = [];
  public maxNumOptionsExpanded = 5;
  public options: AutoCompleteOption[];
  private readonly optionsMap: Map<string, string> = new Map<string, string>();

  public constructor(kwArgs: MultiSelectFilterKwArgs) {
    super({
      filterDimensionId: kwArgs.filterDimensionId,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      id: kwArgs.id,
      label: kwArgs.label,
    });
    this.options = kwArgs.options;
    if (isNumber(kwArgs.maxNumOptionsExpanded)) {
      this.maxNumOptionsExpanded = kwArgs.maxNumOptionsExpanded;
    }
    kwArgs.options.forEach(option => {
      this.optionsMap.set(option.value as string, option.label);
    });
  }

  public getPresentationValue(value?: unknown): string {
    const usedValues = value as string[] ?? this.filterValue;
    return usedValues.map(v => this.optionsMap.get(v)).join(', ');
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

  public toBackendFilter(): CaseDbTypedStringSetFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    return {
      key: this.id,
      members: this.filterValue,
      type: 'STRING_SET',
    };
  }
}
