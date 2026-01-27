import { createStore } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import type { EpiDashboardLayoutUserConfig } from '../../models/epi';
import { DashboardUtil } from '../../utils/DashboardUtil';

export type EpiDashboardGeneralSettings = {
  isHighlightingEnabled: boolean;
};

export type EpiDashboardTreeSettings = {
  isShowDistancesEnabled: boolean;
};

export interface UserProfileStoreState {
  epiDashboardPanels: {
    [key: string]: string;
  };
  epiDashboardLayoutUserConfig: EpiDashboardLayoutUserConfig;
  epiDashboardGeneralSettings: EpiDashboardGeneralSettings;
  epiDashboardTreeSettings: EpiDashboardTreeSettings;
}

export interface UserProfileStoreActions {
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
  epiDashboardLayoutUserConfig: DashboardUtil.createDashboardLayoutUserConfigInitialState(),
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
            epiDashboardLayoutUserConfig: DashboardUtil.createDashboardLayoutUserConfigInitialState(),
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
        epiDashboardPanels: state.epiDashboardPanels,
        epiDashboardLayoutUserConfig: state.epiDashboardLayoutUserConfig,
        epiDashboardGeneralSettings: state.epiDashboardGeneralSettings,
        epiDashboardTreeSettings: state.epiDashboardTreeSettings,
      }),
      version: 1,
    },
  ),
);
