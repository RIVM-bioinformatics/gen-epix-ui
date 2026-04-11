import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import type { IdentityProvider } from '../../api';


export type OidcStore = OidcStoreActions & OidcStoreState;

export interface OidcStoreActions {
  setConfiguration: (configuration: IdentityProvider) => void;
}

export interface OidcStoreState {
  configuration: IdentityProvider;
}

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
      partialize: (state) => ({
        configuration: state.configuration,
      }),
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
    },
  ),
);
