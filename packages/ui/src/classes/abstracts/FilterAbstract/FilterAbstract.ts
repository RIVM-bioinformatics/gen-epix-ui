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

export abstract class FilterAbstract<TFilterValue> {
  public filterDimensionId: string;
  public filterMode: FILTER_MODE;
  public filterPriority: string;
  public filterValue: TFilterValue;
  public id: string;
  public initialFilterValue: TFilterValue;
  public label: string;

  public constructor(kwArgs: FilterAbstractKwArgs) {
    this.id = kwArgs.id;
    this.label = kwArgs.label;
    this.filterMode = kwArgs.filterMode;
    this.filterPriority = kwArgs.filterPriority;
    this.filterDimensionId = kwArgs.filterDimensionId ?? null;
  }

  public fromURLSearchParameterValue(searchParameterValue: string): TFilterValue {
    try {
      return JSON.parse(searchParameterValue) as TFilterValue;
    } catch (error) {
      console.error('Error parsing search parameter value:', error);
      return null;
    }
  }

  public isInitialFilterValue(value?: unknown): boolean {
    const usedValue = value !== undefined ? value : this.filterValue;
    return JSON.stringify(usedValue) === JSON.stringify(this.initialFilterValue);
  }

  public setFilterValue(value: unknown): void {
    this.filterValue = value as TFilterValue;
  }

  public toURLSearchParameterValue(): string {
    return JSON.stringify(this.filterValue);
  }
}
