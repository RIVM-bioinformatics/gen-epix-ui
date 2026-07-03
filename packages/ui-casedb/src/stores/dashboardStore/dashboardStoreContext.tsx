import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import type { DashboardStore } from './dashboardStore';

export const DashboardStoreContext = createContext<StoreApi<DashboardStore>>(null);
