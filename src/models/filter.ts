import type { TFunction } from 'i18next';

import type {
  Case,
  FiltersInner,
} from '../api';
import type { BooleanFilter } from '../classes/filters/BooleanFilter';
import type { DateFilter } from '../classes/filters/DateFilter';
import type { GeoFilter } from '../classes/filters/GeoFilter';
import type { MultiSelectFilter } from '../classes/filters/MultiSelectFilter';
import type { NumberRangeFilter } from '../classes/filters/NumberRangeFilter';
import type { SelectionFilter } from '../classes/filters/SelectionFilter';
import type { TextFilter } from '../classes/filters/TextFilter';
import type { TreeFilter } from '../classes/filters/TreeFilter';

export interface Filter<TFilterValue, TRowValue> {
  initialFilterValue: TFilterValue;
  filterValue: TFilterValue;
  label: string;
  getPresentationValue: (value?: unknown, t?: TFunction<'translation', undefined>) => string;
  matchRowValue: (rowValue: TRowValue, row?: Case) => boolean;
  isInitialFilterValue: (value?: TFilterValue) => boolean;
  setFilterValue: (value: TFilterValue) => void;
  toBackendFilter: () => FiltersInner;
}

export type Filters = Array<DateFilter | GeoFilter | MultiSelectFilter | TextFilter | BooleanFilter | NumberRangeFilter | TreeFilter | SelectionFilter>;

export type FilterValues = { [key: string]: unknown };

export type FilterDimension = {
  id: string;
  label: string;
  description: string;
  filterIds: string[];
  preferredFilterId: string;
  allowMultipleVisibleFilters: boolean;
  allowOnlyPreferredFilter: boolean;
};
