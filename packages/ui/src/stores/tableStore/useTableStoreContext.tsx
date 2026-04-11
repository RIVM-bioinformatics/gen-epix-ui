import { use } from 'react';
import type { StoreApi } from 'zustand';

import type { TableStore } from './tableStore';
import { TableStoreContext } from './TableStoreContext';

export const useTableStoreContext = <TData, >(): StoreApi<TableStore<TData>> => use(TableStoreContext) as StoreApi<TableStore<TData>>;
