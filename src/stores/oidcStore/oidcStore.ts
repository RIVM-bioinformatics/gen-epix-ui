import { createStore } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import type { IdentityProvider } from '../../api';


export interface OidcStoreState {
  configuration: IdentityProvider;
}

export interface OidcStoreActions {
  setConfiguration: (configuration: IdentityProvider) => void;
}

export type OidcStore = OidcStoreState & OidcStoreActions;

export const createOidcStoreInitialState: () => OidcStoreState = () => ({
  configuration: undefined,
});

export const oidcStore = createStore<OidcStore>()(
  persist(
    (set) => {
      return {
        ...createOidcStoreInitialState(),
        setConfiguration: (configuration: IdentityProvider) => {
          set({ configuration });
        },
      };
    },
    {
      name: 'GENEPIX-OIDC-Configuration',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        configuration: state.configuration,
      }),
      version: 1,
    },
  ),
);
