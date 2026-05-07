import {
  type StoreApi,
  useStore,
} from 'zustand';
import { useEffect } from 'react';

import { DEFAULT_FILTER_GROUP } from '../../classes/abstracts/FilterAbstract';
import type { TableColumn } from '../../models/table';
import type { TableStore } from '../../stores/tableStore';
import { TableUtil } from '../../utils/TableUtil';

export type UseInitializeTableStoreKWArgs<TData, TContext = null> = {
  readonly columns: TableColumn<TData, TContext>[];
  readonly context: TContext;
  readonly createFiltersFromColumns?: boolean;
  readonly rows: TData[];
  readonly store: StoreApi<TableStore<TData, TContext>>;
};


export const useInitializeTableStore = <TData, TContext = null>({ columns, context, createFiltersFromColumns, rows, store }: UseInitializeTableStoreKWArgs<TData, TContext>) => {
  const setColumns = useStore(store, (state) => state.setColumns);
  const setBaseData = useStore(store, (state) => state.setBaseData);
  const setFilters = useStore(store, (state) => state.setFilters);
  const initialize = useStore(store, (state) => state.initialize);

  useEffect(() => {
    if (!columns || !rows) {
      return;
    }
    const abortController = new AbortController();
    setColumns(columns);
    setBaseData(rows);
    if (createFiltersFromColumns) {
      setFilters(TableUtil.createFiltersFromColumns(columns, rows, context), [], [DEFAULT_FILTER_GROUP]);
    }

    void initialize(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [columns, initialize, setColumns, setFilters, setBaseData, createFiltersFromColumns, rows, context]);
};
