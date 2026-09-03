import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import type { UserProfileStore } from './userProfileStore';

export const UserProfileStoreContext = createContext<StoreApi<UserProfileStore>>(null);
