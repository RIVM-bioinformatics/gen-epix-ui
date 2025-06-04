import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import type { TableStore } from './tableStore';

export const TableStoreContext = createContext<StoreApi<TableStore<unknown>>>(null);
