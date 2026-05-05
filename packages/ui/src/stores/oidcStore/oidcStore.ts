import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';
import type { CommonDbIdentityProvider } from '@gen-epix/api-commondb';


export type OidcStore = OidcStoreActions & OidcStoreState;

export interface OidcStoreActions {
  setConfiguration: (configuration: CommonDbIdentityProvider) => void;
}

export interface OidcStoreState {
  configuration: CommonDbIdentityProvider;
}

export const createOidcStoreInitialState: () => OidcStoreState = () => ({
  configuration: undefined,
});

export const oidcStore = createStore<OidcStore>()(
  persist(
    (set) => {
      return {
        ...createOidcStoreInitialState(),
        setConfiguration: (configuration: CommonDbIdentityProvider) => {
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
