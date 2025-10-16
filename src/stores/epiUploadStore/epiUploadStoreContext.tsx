import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import type { EpiUploadStore } from './epiUploadStore';

export const EpiUploadStoreContext = createContext<StoreApi<EpiUploadStore>>(null);
