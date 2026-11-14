import type {
  CommonDbCompositeFilter,
  CommonDbExistsFilter,
  CommonDbFiltersInner,
} from '@gen-epix/api-commondb';

export enum FILTER_MODE {
  BACKEND = 'BACKEND',
  FRONTEND = 'FRONTEND',
}

export const DEFAULT_FILTER_GROUP = 'DEFAULT';

export interface FilterAbstractKwArgs {
  filterDimensionId?: string;
  filterMode: FILTER_MODE;
  filterPriority: string;
  id: string;
  label: string;
}

interface FilterURLSearchParameterState {
  genEpixFilterState: 1;
  genEpixFilterValue: unknown;
  includeMissingValues: true;
}

export abstract class FilterAbstract<TFilterValue> {
  public filterDimensionId: string;
  public filterMode: FILTER_MODE;
  public filterPriority: string;
  public filterValue: TFilterValue;
  public id: string;
  public includeMissingValues: boolean = false;
  public initialFilterValue: TFilterValue;
  public label: string;
  public showInSidebar: boolean = true;
  public supportsMissingValuesFilter: boolean = false;

  public get includeMissingValuesFormFieldName(): string {
    const encodedId = encodeURIComponent(this.id).replace(/\./g, '%2E');
    return `__includeMissingValues_${encodedId}`;
  }

  public constructor(kwArgs: FilterAbstractKwArgs) {
    this.id = kwArgs.id;
    this.label = kwArgs.label;
    this.filterMode = kwArgs.filterMode;
    this.filterPriority = kwArgs.filterPriority;
    this.filterDimensionId = kwArgs.filterDimensionId ?? null;
  }

  public static isMissingValue(value: unknown): boolean {
    return value === null
      || value === undefined
      || value === ''
      || (Array.isArray(value) && value.length === 0);
  }

  private static isFilterURLSearchParameterState(value: unknown): value is FilterURLSearchParameterState {
    return typeof value === 'object'
      && value !== null
      && !Array.isArray(value)
      && 'genEpixFilterState' in value
      && value.genEpixFilterState === 1
      && 'genEpixFilterValue' in value
      && 'includeMissingValues' in value
      && value.includeMissingValues === true;
  }

  public fromURLSearchParameterValue(searchParameterValue: string): TFilterValue {
    try {
      return this.parseFilterValueFromURLSearchParameterValue(searchParameterValue) as TFilterValue;
    } catch (error) {
      console.error('Error parsing search parameter value:', error);
      return null;
    }
  }

  public isFilterActive(value?: unknown, includeMissingValues: boolean = this.includeMissingValues): boolean {
    return includeMissingValues || !this.isInitialFilterValue(value);
  }

  public isInitialFilterValue(value?: unknown): boolean {
    const usedValue = value !== undefined ? value : this.filterValue;
    return JSON.stringify(usedValue) === JSON.stringify(this.initialFilterValue);
  }

  public matchRowValueIncludingMissingValues(
    rowValue: unknown,
    matchRowValue: (value: unknown) => boolean,
  ): boolean {
    if (!this.includeMissingValues) {
      return matchRowValue(rowValue);
    }

    if (this.isInitialFilterValue()) {
      return FilterAbstract.isMissingValue(rowValue);
    }

    if (FilterAbstract.isMissingValue(rowValue)) {
      return true;
    }

    return matchRowValue(rowValue);
  }

  public setFilterValue(value: unknown): void {
    this.filterValue = value as TFilterValue;
  }

  public setIncludeMissingValues(includeMissingValues: boolean): void {
    this.includeMissingValues = includeMissingValues;
  }

  public toBackendFilterWithMissingValues(valueFilter?: CommonDbFiltersInner): CommonDbFiltersInner | undefined {
    if (!this.includeMissingValues) {
      return valueFilter;
    }

    const missingValuesFilter: CommonDbExistsFilter = {
      invert: true,
      key: this.id,
      type: 'EXISTS',
    };

    if (!valueFilter) {
      return missingValuesFilter;
    }

    const compositeFilter: CommonDbCompositeFilter = {
      filters: [valueFilter, missingValuesFilter],
      operator: 'OR',
      type: 'COMPOSITE',
    };

    return compositeFilter;
  }

  public toURLSearchParameterValue(): string {
    const serializedFilterValue = JSON.stringify(this.filterValue);
    if (serializedFilterValue === undefined) {
      throw new TypeError('Filter value cannot be serialized as JSON.');
    }
    if (!this.includeMissingValues) {
      return serializedFilterValue;
    }

    const searchParameterValue = JSON.stringify({
      genEpixFilterState: 1,
      genEpixFilterValue: this.filterValue,
      includeMissingValues: true,
    });
    if (searchParameterValue === undefined) {
      throw new TypeError('Filter value cannot be serialized as JSON.');
    }
    return searchParameterValue;
  }

  protected parseFilterValueFromURLSearchParameterValue(searchParameterValue: string): unknown {
    this.includeMissingValues = false;
    const parsedValue: unknown = JSON.parse(searchParameterValue);

    if (!FilterAbstract.isFilterURLSearchParameterState(parsedValue)) {
      return parsedValue;
    }

    this.includeMissingValues = parsedValue.includeMissingValues;
    return parsedValue.genEpixFilterValue;
  }
}
