import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import type { EpiDashboardLayoutUserConfig } from '../../models/epi';
import { DashboardUtil } from '../../utils/DashboardUtil';

export type EpiDashboardGeneralSettings = {
  isHighlightingEnabled: boolean;
};

export type EpiDashboardTreeSettings = {
  isShowDistancesEnabled: boolean;
  isShowSupportLinesWhenUnlinkedEnabled?: boolean;
};

export type UserProfileStore = UserProfileStoreActions & UserProfileStoreState;

export interface UserProfileStoreActions {
  resetEpiDashboardGeneralSettings: () => void;
  resetEpiDashboardLayout: () => void;
  resetEpiDashboardTreeSettings: () => void;
  setEpiDashboardGeneralSettings: (settings: EpiDashboardGeneralSettings) => void;
  setEpiDashboardLayoutUserConfig: (config: EpiDashboardLayoutUserConfig) => void;

  setEpiDashboardPanelConfiguration: (id: string, configuration: string) => void;
  setEpiDashboardTreeSettings: (settings: EpiDashboardTreeSettings) => void;
}

export interface UserProfileStoreState {
  epiDashboardGeneralSettings: EpiDashboardGeneralSettings;
  epiDashboardLayoutUserConfig: EpiDashboardLayoutUserConfig;
  epiDashboardPanels: {
    [key: string]: string;
  };
  epiDashboardTreeSettings: EpiDashboardTreeSettings;
}

export const createUserProfileStoreInitialState: () => UserProfileStoreState = () => ({
  epiDashboardGeneralSettings: {
    isHighlightingEnabled: true,
  },
  epiDashboardLayoutUserConfig: DashboardUtil.createDashboardLayoutUserConfigInitialState(),
  epiDashboardPanels: {},
  epiDashboardTreeSettings: {
    isShowDistancesEnabled: true,
    isShowSupportLinesWhenUnlinkedEnabled: true,
  },
  tableSettings: {},
});

export const userProfileStore = createStore<UserProfileStore>()(
  persist(
    (set, get) => {
      return {
        ...createUserProfileStoreInitialState(),
        resetEpiDashboardGeneralSettings: () => {
          set({
            epiDashboardGeneralSettings: {
              isHighlightingEnabled: true,
            },
          });
        },

        resetEpiDashboardLayout: () => {
          set({
            epiDashboardLayoutUserConfig: DashboardUtil.createDashboardLayoutUserConfigInitialState(),
            epiDashboardPanels: {},
          });
        },
        resetEpiDashboardTreeSettings: () => {
          set({
            epiDashboardTreeSettings: {
              isShowDistancesEnabled: true,
              isShowSupportLinesWhenUnlinkedEnabled: true,
            },
          });
        },

        setEpiDashboardGeneralSettings: (settings: EpiDashboardGeneralSettings) => {
          set({ epiDashboardGeneralSettings: settings });
        },
        setEpiDashboardLayoutUserConfig: (config: EpiDashboardLayoutUserConfig) => {
          set({ epiDashboardLayoutUserConfig: config });
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
        setEpiDashboardTreeSettings: (settings: EpiDashboardTreeSettings) => {
          set({ epiDashboardTreeSettings: settings });
        },
      };
    },
    {
      name: 'GENEPIX-User-Profile',
      partialize: (state) => ({
        epiDashboardGeneralSettings: state.epiDashboardGeneralSettings,
        epiDashboardLayoutUserConfig: state.epiDashboardLayoutUserConfig,
        epiDashboardPanels: state.epiDashboardPanels,
        epiDashboardTreeSettings: state.epiDashboardTreeSettings,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 2,
    },
  ),
);
