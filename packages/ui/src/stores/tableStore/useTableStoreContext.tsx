import { useContext } from 'react';
import type { StoreApi } from 'zustand';

import type { TableStore } from './tableStore';
import { TableStoreContext } from './TableStoreContext';

export const useTableStoreContext = <TData, >(): StoreApi<TableStore<TData>> => useContext(TableStoreContext) as StoreApi<TableStore<TData>>;
