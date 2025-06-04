import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import type { EpiStore } from './epiStore';

export const EpiStoreContext = createContext<StoreApi<EpiStore>>(null);
