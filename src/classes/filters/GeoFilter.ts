import isArray from 'lodash/isArray';

import type { TypedStringSetFilter } from '../../api';
import type { Filter } from '../../models/filter';
import type { FilterAbstractKwArgs } from '../abstracts/FilterAbstract';
import { FilterAbstract } from '../abstracts/FilterAbstract';
import type { AutoCompleteOption } from '../../models/form';

export interface GeoFilterKwArgs extends FilterAbstractKwArgs {
  options: AutoCompleteOption[];
}

export class GeoFilter extends FilterAbstract<string[]> implements Filter<string[], string> {
  public options: AutoCompleteOption[];
  private readonly optionsMap: Map<string, string> = new Map<string, string>();
  public initialFilterValue: string[] = [];
  public filterValue: string[] = [];

  public constructor(kwArgs: GeoFilterKwArgs) {
    super({
      id: kwArgs.id,
      label: kwArgs.label,
      filterMode: kwArgs.filterMode,
      filterPriority: kwArgs.filterPriority,
      filterDimensionId: kwArgs.filterDimensionId,
    });
    this.options = kwArgs.options;
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
