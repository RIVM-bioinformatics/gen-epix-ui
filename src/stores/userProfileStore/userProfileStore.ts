import { createStore } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import type { IdentityProvider } from '../../api';
import type { EpiDashboardLayoutUserConfig } from '../../models/epi';
import { EpiDashboardUtil } from '../../utils/EpiDashboardUtil';

export type EpiDashboardGeneralSettings = {
  isHighlightingEnabled: boolean;
};

export type EpiDashboardTreeSettings = {
  isShowDistancesEnabled: boolean;
};

export interface UserProfileStoreState {
  oidcConfiguration: IdentityProvider;
  epiDashboardPanels: {
    [key: string]: string;
  };
  epiDashboardLayoutUserConfig: EpiDashboardLayoutUserConfig;
  epiDashboardGeneralSettings: EpiDashboardGeneralSettings;
  epiDashboardTreeSettings: EpiDashboardTreeSettings;
}

export interface UserProfileStoreActions {
  setOidcConfiguration: (oidcConfiguration: IdentityProvider) => void;
  setEpiDashboardPanelConfiguration: (id: string, configuration: string) => void;
  setEpiDashboardLayoutUserConfig: (config: EpiDashboardLayoutUserConfig) => void;
  resetEpiDashboardLayout: () => void;
  setEpiDashboardGeneralSettings: (settings: EpiDashboardGeneralSettings) => void;
  resetEpiDashboardGeneralSettings: () => void;

  setEpiDashboardTreeSettings: (settings: EpiDashboardTreeSettings) => void;
  resetEpiDashboardTreeSettings: () => void;
}

export type UserProfileStore = UserProfileStoreState & UserProfileStoreActions;

export const createUserProfileStoreInitialState: () => UserProfileStoreState = () => ({
  tableSettings: {},
  epiDashboardPanels: {},
  oidcConfiguration: undefined,
  epiDashboardLayoutUserConfig: EpiDashboardUtil.createDashboardLayoutUserConfigInitialState(),
  epiDashboardGeneralSettings: {
    isHighlightingEnabled: true,
  },
  epiDashboardTreeSettings: {
    isShowDistancesEnabled: true,
  },
});

export const userProfileStore = createStore<UserProfileStore>()(
  persist(
    (set, get) => {
      return {
        ...createUserProfileStoreInitialState(),
        setOidcConfiguration: (oidcConfiguration: IdentityProvider) => {
          set({ oidcConfiguration });
        },

        setEpiDashboardPanelConfiguration: (id: string, configuration: string) => {
          const epiDashboardPanels = get().epiDashboardPanels;
          set({
            epiDashboardPanels: {
              ...epiDashboardPanels,
              [id]: configuration,
            },
          });
        },

        setEpiDashboardLayoutUserConfig: (config: EpiDashboardLayoutUserConfig) => {
          set({ epiDashboardLayoutUserConfig: config });
        },
        resetEpiDashboardLayout: () => {
          set({
            epiDashboardLayoutUserConfig: EpiDashboardUtil.createDashboardLayoutUserConfigInitialState(),
            epiDashboardPanels: {},
          });
        },

        setEpiDashboardGeneralSettings: (settings: EpiDashboardGeneralSettings) => {
          set({ epiDashboardGeneralSettings: settings });
        },
        resetEpiDashboardGeneralSettings: () => {
          set({
            epiDashboardGeneralSettings: {
              isHighlightingEnabled: true,
            },
          });
        },

        setEpiDashboardTreeSettings: (settings: EpiDashboardTreeSettings) => {
          set({ epiDashboardTreeSettings: settings });
        },
        resetEpiDashboardTreeSettings: () => {
          set({
            epiDashboardTreeSettings: {
              isShowDistancesEnabled: true,
            },
          });
        },
      };
    },
    {
      name: 'GENEPIX-User-Profile',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        oidcConfiguration: state.oidcConfiguration,
        epiDashboardPanels: state.epiDashboardPanels,
        epiDashboardLayoutUserConfig: state.epiDashboardLayoutUserConfig,
        epiDashboardGeneralSettings: state.epiDashboardGeneralSettings,
        epiDashboardTreeSettings: state.epiDashboardTreeSettings,
      }),
      version: 1,
    },
  ),
);
