import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';
import type { CaseDbIdentityProvider } from '@gen-epix/api-casedb';


export type OidcStore = OidcStoreActions & OidcStoreState;

export interface OidcStoreActions {
  setConfiguration: (configuration: CaseDbIdentityProvider) => void;
}

export interface OidcStoreState {
  configuration: CaseDbIdentityProvider;
}

export const createOidcStoreInitialState: () => OidcStoreState = () => ({
  configuration: undefined,
});

export const oidcStore = createStore<OidcStore>()(
  persist(
    (set) => {
      return {
        ...createOidcStoreInitialState(),
        setConfiguration: (configuration: CaseDbIdentityProvider) => {
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
