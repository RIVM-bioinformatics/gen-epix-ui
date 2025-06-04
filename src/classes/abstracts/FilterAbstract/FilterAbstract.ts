export enum FILTER_MODE {
  BACKEND = 'BACKEND',
  FRONTEND = 'FRONTEND',
}

export const DEFAULT_FILTER_GROUP = 'DEFAULT';

export interface FilterAbstractKwArgs {
  id: string;
  label: string;
  filterMode: FILTER_MODE;
  filterPriority: string;
  filterDimensionId?: string;
}

export abstract class FilterAbstract<TFilterValue> {
  public initialFilterValue: TFilterValue;
  public filterValue: TFilterValue;
  public label: string;
  public id: string;
  public filterMode: FILTER_MODE;
  public filterPriority: string;
  public filterDimensionId: string;

  public constructor(kwArgs: FilterAbstractKwArgs) {
    this.id = kwArgs.id;
    this.label = kwArgs.label;
    this.filterMode = kwArgs.filterMode;
    this.filterPriority = kwArgs.filterPriority;
    this.filterDimensionId = kwArgs.filterDimensionId ?? null;
  }

  public setFilterValue(value: unknown): void {
    this.filterValue = value as TFilterValue;
  }

  public isInitialFilterValue(value?: unknown): boolean {
    const usedValue = value !== undefined ? value : this.filterValue;
    return JSON.stringify(usedValue) === JSON.stringify(this.initialFilterValue);
  }
}
