import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import type { UploadStore } from './uploadStore';

export const UploadStoreContext = createContext<StoreApi<UploadStore>>(null);
