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
  filterValue: TFilterValue;
  getPresentationValue: (value?: unknown, t?: TFunction<'translation', undefined>) => string;
  initialFilterValue: TFilterValue;
  isInitialFilterValue: (value?: TFilterValue) => boolean;
  label: string;
  matchRowValue: (rowValue: TRowValue, row?: Case) => boolean;
  setFilterValue: (value: TFilterValue) => void;
  toBackendFilter: () => FiltersInner;
}

export type FilterDimension = {
  allowMultipleVisibleFilters: boolean;
  allowOnlyPreferredFilter: boolean;
  description: string;
  filterIds: string[];
  id: string;
  label: string;
  preferredFilterId: string;
};

export type Filters = Array<BooleanFilter | DateFilter | GeoFilter | MultiSelectFilter | NumberRangeFilter | SelectionFilter | TextFilter | TreeFilter>;

export type FilterValues = { [key: string]: unknown };
