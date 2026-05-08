import type { TFunction } from 'i18next';
import type { CommonDbFiltersInner } from '@gen-epix/api-commondb';

import type { FilterAbstract } from '../classes/abstracts/FilterAbstract/FilterAbstract';
import type { BooleanFilter } from '../classes/filters/BooleanFilter';
import type { DateFilter } from '../classes/filters/DateFilter';
import type { GeoFilter } from '../classes/filters/GeoFilter';
import type { MultiSelectFilter } from '../classes/filters/MultiSelectFilter';
import type { NumberRangeFilter } from '../classes/filters/NumberRangeFilter';
import type { TextFilter } from '../classes/filters/TextFilter';

export type BuiltinFilter = BooleanFilter | DateFilter | GeoFilter | MultiSelectFilter | NumberRangeFilter | TextFilter;

export interface Filter<TFilterValue, TRowValue> {
  filterValue: TFilterValue;
  getPresentationValue: (value?: unknown, t?: TFunction<'translation', undefined>) => string;
  initialFilterValue: TFilterValue;
  isInitialFilterValue: (value?: TFilterValue) => boolean;
  label: string;
  matchRowValue: (rowValue: TRowValue) => boolean;
  setFilterValue: (value: TFilterValue) => void;
  toBackendFilter: () => CommonDbFiltersInner;
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

export type FilterInstance = FilterAbstract<unknown>
  & Pick<Filter<never, never>, 'matchRowValue'>
  & Pick<Filter<unknown, never>, 'getPresentationValue' | 'toBackendFilter'>;

export type Filters<TExtraFilters extends FilterInstance = FilterInstance> = Array<BuiltinFilter | TExtraFilters>;

export type FilterValues = { [key: string]: unknown };
