import isArray from 'lodash/isArray';
import type { CommonDbTypedStringSetFilter } from '@gen-epix/api-commondb';

import type { Filter } from '../../models/filter';
import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { AutoCompleteOption } from '../../models/form';

export interface GeoFilterKwArgs extends FilterAbstractKwArgs {
  options: AutoCompleteOption[];
}

export class GeoFilter extends FilterAbstract<string[]> implements Filter<string[], string> {
  public filterValue: string[] = [];
  public initialFilterValue: string[] = [];
  public options: AutoCompleteOption[];
  private readonly optionsMap: Map<string, string> = new Map<string, string>();

  public constructor(kwArgs: GeoFilterKwArgs) {
    super({
      filterDimensionId: kwArgs.filterDimensionId,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      id: kwArgs.id,
      label: kwArgs.label,
    });
    this.options = kwArgs.options;
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
    return (this.filterValue).includes(rowValue);
  }

  public toBackendFilter(): CommonDbTypedStringSetFilter {
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
