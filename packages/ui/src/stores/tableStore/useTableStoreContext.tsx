import { use } from 'react';
import type { StoreApi } from 'zustand';

import type { TableStore } from './tableStore';
import { TableStoreContext } from './TableStoreContext';

export const useTableStoreContext = <TData, TContext>(): StoreApi<TableStore<TData, TContext>> => use(TableStoreContext) as StoreApi<TableStore<TData, TContext>>;
