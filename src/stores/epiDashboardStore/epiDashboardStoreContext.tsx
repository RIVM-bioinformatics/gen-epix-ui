import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import type { EpiDashboardStore } from './epiDashboardStore';

export const EpiDashboardStoreContext = createContext<StoreApi<EpiDashboardStore>>(null);
