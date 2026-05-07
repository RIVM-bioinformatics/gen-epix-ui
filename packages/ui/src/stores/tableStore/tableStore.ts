import { createStore } from 'zustand';
import type { NavigateFunction } from 'react-router-dom';
import { produce } from 'immer';
import first from 'lodash/first';
import intersection from 'lodash/intersection';
import keyBy from 'lodash/keyBy';
import last from 'lodash/last';
import type { PersistOptions } from 'zustand/middleware';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../classes/abstracts/FilterAbstract';
import { WindowManager } from '../../classes/managers/WindowManager';
import type { TableEvent } from '../../classes/TableEventBus';
import { TableEventBus } from '../../classes/TableEventBus';
import type {
  FilterDimension,
  Filters,
  FilterValues,
} from '../../models/filter';
import type { UnwrapArray } from '../../models/generic';
import type {
  TableColumn,
  TableColumnDimension,
  TableColumnVisualSettings,
  TableSortDirection,
} from '../../models/table';
import { ObjectUtil } from '../../utils/ObjectUtil';
import { TableUtil } from '../../utils/TableUtil';


export interface CreateTableStoreInitialStateKwArgs<TData> {
  defaultSortByField?: string;
  defaultSortDirection?: TableSortDirection;
  idSelectorCallback: (row: TData) => string;
  isRowEnabledCallback?: (row: TData) => boolean;
  navigatorFunction?: NavigateFunction;
}
export type CreateTableStoreKwArgs<TData> = {
  storageNamePostFix?: string;
  storageVersion?: number;
} & CreateTableStoreInitialStateKwArgs<TData>;

export type TableStore<TData> = TableStoreActions<TData> & TableStoreState<TData>;

export interface TableStoreActions<TData> {
  addEventListener: <TEventName extends keyof TableEvent>(eventName: TEventName, callback: (payload: TableEvent[TEventName]) => void) => () => void;
  destroy: () => void;
  emitEvent: <TEventName extends keyof TableEvent>(eventName: TEventName, payload?: TableEvent[TEventName]) => void;
  fetchData: () => Promise<void> | void;

  initialize: (globalAbortSignal: AbortSignal) => Promise<void>;
  reloadFilterData: (fistFilterPriorityToFilterFrom?: string) => void;
  reloadFilterPriorityData: (filterPriority: string, data: TData[]) => TData[];
  reloadSelectedIds: () => void;
  reloadSortedData: () => void;
  resetFilters: () => Promise<void>;

  selectId: (id: string) => void;
  setBaseData: (items: TData[]) => void;

  setColumnDimensions: (columnDimensions: TableColumnDimension[]) => void;
  setColumns: (columns: TableColumn<TData>[]) => void;
  setColumnVisualSettings: (columnVisualSettings: TableColumnVisualSettings[]) => void;

  setFilters: (filters: Filters, filterDimensions: FilterDimension[], frontendFilterPriorities: string[]) => void;
  setFilterValue: (id: string, value: unknown) => Promise<void>;

  setFilterValues: (filterValues: FilterValues) => Promise<void>;
  setNavigateFunction: (navigateFunction: NavigateFunction) => void;

  setSelectedIds: (selectedIds: string[]) => void;
  setSortedIds: (sortedIds: string[]) => void;
  setSorting(id: string, direction: TableSortDirection): Promise<void>;
  setVisibleFilterWithinDimension: (filterDimensionId: string, filterId: string) => void;
  setVisibleFilterWithinDimensions: (visibleFilters: { [key: string]: string }) => void;
  unselectId: (id: string) => void;
  // private
  updateUrl: (searchParams: URLSearchParams) => Promise<void>;
}

export interface TableStoreState<TData> {
  backendFilters: Filters;
  baseData: TData[];
  columnDimensions: TableColumnDimension[];
  columns: TableColumn<TData>[];
  columnVisualSettings: TableColumnVisualSettings[];
  dataError: Error;
  defaultSortByField: string;
  defaultSortDirection: TableSortDirection;
  eventBus: TableEventBus;
  fetchAbortController: AbortController;
  filterDimensions: FilterDimension[];
  filteredData: { [key: string]: TData[] };
  filters: Filters;
  filterValues: FilterValues;
  frontendFilterPriorities: string[];
  frontendFilters: { [key: string]: Filters };
  globalAbortSignal: AbortSignal;
  idSelectorCallback: (row: TData) => string;
  isDataLoading: boolean;
  isInitialized: boolean;
  isRowEnabledCallback: (row: TData) => boolean;
  navigateFunction: NavigateFunction;
  selectedIds: string[];
  sortByField: string;
  sortDirection: TableSortDirection;
  sortedData: TData[];
  sortedIds: string[];
  visibleFilterWithinDimensions: { [key: string]: string };
}

type Get<TData> = () => TableStore<TData>;

type Set<TData> = (partial: ((state: TableStore<TData>) => Partial<TableStore<TData>> | TableStore<TData>) | Partial<TableStore<TData>> | TableStore<TData>, replace?: false) => void;

export const createTableStoreInitialState = <TData>(kwArgs: CreateTableStoreInitialStateKwArgs<TData>): TableStoreState<TData> => {
  const { defaultSortByField, defaultSortDirection, idSelectorCallback, isRowEnabledCallback, navigatorFunction } = kwArgs;
  const url = new URL(document.location.href);
  const searchParams = url.searchParams;

  let sortByField = defaultSortByField;
  let sortDirection = defaultSortDirection;

  if (navigatorFunction) {
    if (searchParams.get('sortByField')) {
      sortByField = searchParams.get('sortByField');
    }
    if (searchParams.get('sortDirection')) {
      sortDirection = searchParams.get('sortDirection') as TableSortDirection;
    }
  }

  return {
    backendFilters: [],
    baseData: [],
    columnDimensions: null,
    columns: [],
    columnVisualSettings: [],
    dataError: null,
    defaultSortByField,
    defaultSortDirection,
    eventBus: new TableEventBus(),
    fetchAbortController: null,
    filterDimensions: [],
    filteredData: { [DEFAULT_FILTER_GROUP]: [] },
    filters: [],
    filterValues: {},
    frontendFilterPriorities: [DEFAULT_FILTER_GROUP],
    frontendFilters: { [DEFAULT_FILTER_GROUP]: [] },
    globalAbortSignal: null,
    idSelectorCallback,
    isDataLoading: false,
    isInitialized: false,
    isRowEnabledCallback,
    navigateFunction: navigatorFunction,
    selectedIds: [],
    sortByField,
    sortDirection,
    sortedData: [],
    sortedIds: null,
    visibleFilterWithinDimensions: {},
  };
};

export const updateSearchParams = (key: string, value: string, givenSearchParams?: URLSearchParams): URLSearchParams => {
  let searchParams: URLSearchParams;
  if (givenSearchParams) {
    searchParams = givenSearchParams;
  } else {
    const url = new URL(document.location.href);
    searchParams = url.searchParams;
  }
  searchParams.set(key, value);
  return searchParams;
};

export const createTableStorePersistConfiguration = <TData, TStore extends TableStore<TData>>(storageNamePostFix: string, version: number, partialize?: (state: Partial<TStore>) => Partial<TStore>): PersistOptions<TStore> => {
  return {
    name: `GENEPIX-TableStore-${storageNamePostFix}`,
    partialize: (state) => ({
      columnVisualSettings: state.columnVisualSettings,
      sortByField: state.sortByField,
      sortDirection: state.sortDirection,
      ...partialize?.(state),
    } as TStore),
    storage: createJSONStorage(() => localStorage),
    version,
  } satisfies PersistOptions<TStore>;
};

export const createTableStoreActions = <TData>(kwArgs: {
  get: Get<TData>;
  set: Set<TData>;
}): TableStoreActions<TData> => {
  const { get, set } = kwArgs;
  return {
    addEventListener: (eventName, callback) => {
      return get().eventBus.addEventListener(eventName, callback);
    },
    destroy: () => {
      const { emitEvent, eventBus } = get();
      eventBus.destroy();
      emitEvent('destroy');
    },
    emitEvent: (eventName, payload) => {
      get().eventBus.emit(eventName, payload);
    },
    fetchData: () => {
      const { reloadFilterData } = get();
      reloadFilterData();
    },
    initialize: async (globalAbortSignal?: AbortSignal) => {
      if (globalAbortSignal) {
        set({ globalAbortSignal });
      }
      const { columns, columnVisualSettings, destroy, fetchData, setColumnVisualSettings, sortByField, sortDirection, updateUrl } = get();

      if (!TableUtil.areColumnVisualSettingsValid(columns, columnVisualSettings)) {
        setColumnVisualSettings(TableUtil.createInitialVisualColumnSettings(columns));
      }

      const globalAbortSignalListener = () => {
        globalAbortSignal.removeEventListener('abort', globalAbortSignalListener);
        destroy();
      };
      globalAbortSignal.addEventListener('abort', globalAbortSignalListener);
      await updateUrl(updateSearchParams('sortByField', sortByField));
      await updateUrl(updateSearchParams('sortDirection', sortDirection));
      await fetchData();
      set({ isInitialized: true });
    },
    reloadFilterData: (givenFistFilterPriorityToFilterFrom?: string) => {
      const { baseData, filteredData: previousFilteredData, frontendFilterPriorities, reloadFilterPriorityData, reloadSortedData } = get();
      const firstFilterPriorityToFilterFrom = givenFistFilterPriorityToFilterFrom || first(frontendFilterPriorities);
      const filteredData = Object.fromEntries(frontendFilterPriorities.map(frontendFilterPriority => [frontendFilterPriority, []] as [string, TData[]]));
      let data = baseData;

      if (givenFistFilterPriorityToFilterFrom) {
        // prefill with previous data
        frontendFilterPriorities.slice(0, frontendFilterPriorities.indexOf(firstFilterPriorityToFilterFrom)).forEach(filterPriority => {
          filteredData[filterPriority] = previousFilteredData[filterPriority];
          data = previousFilteredData[filterPriority];
        });
      }

      const filterPrioritiesToFilter = frontendFilterPriorities.slice(frontendFilterPriorities.indexOf(firstFilterPriorityToFilterFrom));
      filterPrioritiesToFilter.forEach(filterPriority => {
        data = reloadFilterPriorityData(filterPriority, data);
        filteredData[filterPriority] = data;
      });
      set({ filteredData });
      reloadSortedData();
    },
    reloadFilterPriorityData: (filterPriority: string, data: TData[]): TData[] => {
      const { columns, frontendFilters } = get();
      const filters = frontendFilters[filterPriority];

      const columnMap = keyBy(columns, 'id');
      const items = data.filter((row, rowIndex) => {
        return filters.every(filter => {
          if (filter.isInitialFilterValue(filter.filterValue)) {
            return true;
          }

          const column = columnMap[filter.id];
          const value = column.valueGetter ? column.valueGetter({ id: column.id, row, rowIndex }) : row[column.id as keyof TData];
          return (filter.matchRowValue as (value: unknown) => boolean)(value);
        });
      });

      return items;
    },
    reloadSelectedIds: () => {
      const { idSelectorCallback, selectedIds, setSelectedIds, sortedData } = get();
      setSelectedIds(intersection(selectedIds, sortedData.map(item => idSelectorCallback(item))));
    },
    reloadSortedData: () => {
      const { columns, defaultSortByField, defaultSortDirection, filteredData, frontendFilterPriorities, idSelectorCallback, sortByField, sortDirection, sortedIds } = get();

      const preSortedData: TData[] = filteredData[last(frontendFilterPriorities)];
      let sanitizedSortByField = sortByField;
      let sanitizedSortDirection = sortDirection;

      // Nothing to sort
      if ((!sanitizedSortByField || !sortDirection) && !sortedIds) {
        set({ sortedData: preSortedData });
        return;
      }

      if (sanitizedSortByField && sanitizedSortDirection) {
        // Sort according to the sortByField and sortDirection
        let column = columns.find(c => c.id === sortByField);

        if (!column || !(column as { comparatorFactory: unknown }).comparatorFactory) {
          console.warn(`Column not found or missing comparatorFactory for field '${sortByField}', reverting to default sort settings.`);
          sanitizedSortByField = defaultSortByField;
          sanitizedSortDirection = defaultSortDirection;
          column = columns.find(c => c.id === sanitizedSortByField);
        }

        if (!column || !(column as { comparatorFactory: unknown }).comparatorFactory) {
          console.error(`Column not found or missing comparatorFactory for field '${sortByField}'`);
          set({ sortedData: preSortedData });
          return;
        }

        // Note: as never because the type of column can be of different types
        const comparator = column.comparatorFactory?.({ column: column as never, direction: sanitizedSortDirection });
        const sortedData = preSortedData.toSorted((a, b) => {
          if (column.comparatorFactory) {
            return comparator(a, b);
          }
          return 0;
        });
        set({ sortedData });
        return;
      }

      // Sort according to the sortedIds
      if (sortedIds) {
        const sortedData = preSortedData.toSorted((a, b) => {
          const aId = idSelectorCallback(a);
          const bId = idSelectorCallback(b);

          const aIndex = sortedIds.includes(aId) ? sortedIds.indexOf(aId) : Infinity;
          const bIndex = sortedIds.includes(bId) ? sortedIds.indexOf(bId) : Infinity;
          return aIndex - bIndex;
        });
        set({ sortedData });
      }
    },
    resetFilters: async () => {
      const { setFilterValues } = get();
      const filterValues: FilterValues = {};
      get().filters.forEach(filter => {
        filterValues[filter.id] = filter.initialFilterValue;
      });
      await setFilterValues(filterValues);
    },
    selectId: (id: string) => {
      const { selectedIds, setSelectedIds } = get();
      if (!selectedIds.includes(id)) {
        setSelectedIds([...selectedIds, id]);
      }
    },
    setBaseData: (items: TData[]) => {
      const { reloadFilterData } = get();
      set({ baseData: items });
      reloadFilterData();
    },
    setColumnDimensions: (columnDimensions: TableColumnDimension[]) => {
      set({ columnDimensions });
    },
    setColumns: (columns: TableColumn<TData>[]) => {
      set({ columns });
    },
    setColumnVisualSettings: (columnVisualSettings: TableColumnVisualSettings[]) => {
      set({ columnVisualSettings });
    },
    setFilters: (filters: Filters, filterDimensions: FilterDimension[], frontendFilterPriorities: string[]) => {
      const { navigateFunction } = get();
      set({ filterDimensions, filters });
      set({ backendFilters: filters.filter(filter => filter.filterMode === FILTER_MODE.BACKEND) });
      set({
        frontendFilters: Object.fromEntries(frontendFilterPriorities.map(filterPriority => [filterPriority, filters.filter(filter => filter.filterPriority === filterPriority)])),
      });
      if (navigateFunction) {
        const searchParams = new URLSearchParams(WindowManager.getInstance().window.document.location.search);
        filters.forEach(filter => {
          const searchParamStringValue = searchParams.get(filter.id);
          if (!searchParamStringValue) {
            return;
          }
          filter.setFilterValue(filter.fromURLSearchParameterValue(searchParamStringValue));
        });
      }
    },
    setFilterValue: async (id: string, value: unknown) => {
      const { filterDimensions, filters, setFilterValues, setVisibleFilterWithinDimension } = get();
      const filterValues: FilterValues = {};
      let foundFilter: UnwrapArray<Filters>;
      filters.forEach(filter => {
        if (filter.id === id) {
          filterValues[id] = value;
          foundFilter = filter;
        } else {
          filterValues[filter.id] = filter.filterValue;
        }
      });

      if (foundFilter?.filterDimensionId) {
        const filterDimension = filterDimensions.find(f => f.id === foundFilter.filterDimensionId);
        const otherFiltersWithinDimension = filters.filter(filter => filter.filterDimensionId === filterDimension.id && filter.id !== foundFilter.id);
        otherFiltersWithinDimension.forEach(filter => {
          filterValues[filter.id] = filter.initialFilterValue;
        });
        setVisibleFilterWithinDimension(foundFilter.filterDimensionId, foundFilter.id);
      }
      await setFilterValues(filterValues);
    },
    setFilterValues: async (filterValues: FilterValues) => {
      const { fetchData, filters, frontendFilterPriorities, navigateFunction, reloadFilterData, updateUrl } = get();

      const backendFilterValues: FilterValues = {};
      const frontendFilterValues: { [key: string]: FilterValues } = {};

      const previousBackendFilterValues: FilterValues = {};
      const previousFrontendFilterValues: { [key: string]: FilterValues } = {};

      filters.forEach(filter => {
        if (filter.filterMode === FILTER_MODE.BACKEND) {
          previousBackendFilterValues[filter.id] = filter.filterValue;
        }
        if (filter.filterMode === FILTER_MODE.FRONTEND) {
          previousFrontendFilterValues[filter.filterPriority] = previousFrontendFilterValues[filter.filterPriority] || {};
          previousFrontendFilterValues[filter.filterPriority][filter.id] = filter.filterValue;
        }
      });

      const newFilters = produce(filters, (draft) => {
        draft.forEach(filter => {
          if (filterValues[filter.id] !== undefined) {
            filter.setFilterValue(filterValues[filter.id]);
          }
        });
        return draft;
      });
      set({ filters: newFilters });

      if (navigateFunction) {
        const url = new URL(document.location.href);
        let searchParams = url.searchParams;
        newFilters.forEach(filter => {
          if (filter.isInitialFilterValue(filter.filterValue)) {
            searchParams.delete(filter.id);
            return;
          }
          searchParams = updateSearchParams(filter.id, filter.toURLSearchParameterValue());
        });
        await updateUrl(searchParams);
      }

      newFilters.forEach(filter => {
        if (filter.filterMode === FILTER_MODE.BACKEND) {
          backendFilterValues[filter.id] = filter.filterValue;
        }
        if (filter.filterMode === FILTER_MODE.FRONTEND) {
          frontendFilterValues[filter.filterPriority] = frontendFilterValues[filter.filterPriority] || {};
          frontendFilterValues[filter.filterPriority][filter.id] = filter.filterValue;
        }
      });

      const backendFilerValuesDiff = ObjectUtil.getObjectDiff(previousBackendFilterValues, backendFilterValues);
      if (backendFilerValuesDiff.length > 0) {
        await fetchData();
        return;
      }

      const fistFilterPriorityToFilterFrom = frontendFilterPriorities.find(filterPriority => {
        const filterValuesDiff = ObjectUtil.getObjectDiff(previousFrontendFilterValues[filterPriority], frontendFilterValues[filterPriority]);
        if (filterValuesDiff.length > 0) {
          return filterPriority;
        }
        return null;
      });

      reloadFilterData(fistFilterPriorityToFilterFrom);
    },
    setNavigateFunction: (navigateFunction: NavigateFunction) => {
      set({ navigateFunction });
    },
    setSelectedIds: (selectedIds: string[]) => {
      set({ selectedIds });
    },
    setSortedIds: (sortedIds: string[]) => {
      set({ sortedIds });
    },
    setSorting: async (sortByField: string, sortDirection: TableSortDirection) => {
      const { reloadSortedData, updateUrl } = get();
      await updateUrl(updateSearchParams('sortByField', sortByField));
      await updateUrl(updateSearchParams('sortDirection', sortDirection));
      set({ sortByField, sortDirection });
      reloadSortedData();
    },
    setVisibleFilterWithinDimension: (filterDimensionId: string, filterId: string) => {
      const { visibleFilterWithinDimensions } = get();

      set({
        visibleFilterWithinDimensions: {
          ...visibleFilterWithinDimensions,
          [filterDimensionId]: filterId,
        },
      });
    },
    setVisibleFilterWithinDimensions: (visibleFilterWithinDimensions) => {
      set({ visibleFilterWithinDimensions });
    },
    unselectId: (id: string) => {
      const { selectedIds, setSelectedIds } = get();
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(x => x !== id));
      }
    },
    updateUrl: async (searchParams: URLSearchParams) => {
      const { navigateFunction } = get();
      if (!navigateFunction) {
        return;
      }
      await navigateFunction(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    },
  };
};

export const createTableStore = <TData>(kwArgs: CreateTableStoreKwArgs<TData>) => {
  const { storageNamePostFix, storageVersion, ...initialStateParams } = kwArgs;
  const initialState = createTableStoreInitialState<TData>(initialStateParams);

  if (!storageNamePostFix) {
    return createStore<TableStore<TData>>()(
      (set, get) => {
        return {
          ...initialState,
          ...createTableStoreActions<TData>({ get, set }),
        };
      },
    );
  }

  return createStore<TableStore<TData>>()(
    persist(
      (set, get) => {
        return {
          ...initialState,
          ...createTableStoreActions<TData>({ get, set }),
        };
      },
      createTableStorePersistConfiguration<TData, TableStore<TData>>(storageNamePostFix, storageVersion),
    ),
  );
};
