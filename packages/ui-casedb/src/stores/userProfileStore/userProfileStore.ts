import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import type {
  EpiDashboardArrangementConfig,
  EpiDashboardEpiCurveSettings,
  EpiDashboardTreeSettings,
} from '../../models/epi';
import { DashboardUtil } from '../../utils/DashboardUtil';


export type EpiDashboardGeneralSettings = {
  isHighlightingEnabled: boolean;
};


export type UserProfileStore = UserProfileStoreActions & UserProfileStoreState;

export interface UserProfileStoreActions {
  resetEpiDashboardEpiCurveSettings: () => void;
  resetEpiDashboardGeneralSettings: () => void;
  resetEpiDashboardLayout: () => void;
  resetEpiDashboardTreeSettings: () => void;
  setEpiDashboardArrangementConfig: (config: EpiDashboardArrangementConfig) => void;
  setEpiDashboardEpiCurveSettings: (settings: EpiDashboardEpiCurveSettings) => void;
  setEpiDashboardGeneralSettings: (settings: EpiDashboardGeneralSettings) => void;
  setEpiDashboardPanelConfiguration: (id: string, configuration: string) => void;
  setEpiDashboardTreeSettings: (settings: EpiDashboardTreeSettings) => void;
}

export interface UserProfileStoreState {
  epiDashboardArrangementConfig: EpiDashboardArrangementConfig;
  epiDashboardEpiCurveSettings: EpiDashboardEpiCurveSettings;
  epiDashboardGeneralSettings: EpiDashboardGeneralSettings;
  epiDashboardPanels: {
    [key: string]: string;
  };
  epiDashboardTreeSettings: EpiDashboardTreeSettings;
  epiDashboardWidgetSettings: {
    [key: string]: unknown;
  };
}

export const createUserProfileStoreInitialState: () => UserProfileStoreState = () => ({
  epiDashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(),
  epiDashboardEpiCurveSettings: {
    isIncludeMissingValuesInAreaChartEnabled: false,
  },
  epiDashboardGeneralSettings: {
    isHighlightingEnabled: true,
  },
  epiDashboardPanels: {},
  epiDashboardTreeSettings: {
    isShowDistancesEnabled: true,
    isShowSupportLinesWhenUnlinkedEnabled: true,
  },
  epiDashboardWidgetSettings: {},
  tableSettings: {},
});

export const createUserProfileStore = () => createStore<UserProfileStore>()(
  persist(
    (set, get) => {
      return {
        ...createUserProfileStoreInitialState(),
        resetEpiDashboardEpiCurveSettings: () => {
          set({
            epiDashboardEpiCurveSettings: {
              isIncludeMissingValuesInAreaChartEnabled: false,
            },
          });
        },
        resetEpiDashboardGeneralSettings: () => {
          set({
            epiDashboardGeneralSettings: {
              isHighlightingEnabled: true,
            },
          });
        },
        resetEpiDashboardLayout: () => {
          set({
            epiDashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(),
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
        setEpiDashboardArrangementConfig: (config: EpiDashboardArrangementConfig) => {
          set({ epiDashboardArrangementConfig: config });
        },
        setEpiDashboardEpiCurveSettings: (settings: EpiDashboardEpiCurveSettings) => {
          set({ epiDashboardEpiCurveSettings: settings });
        },

        setEpiDashboardGeneralSettings: (settings: EpiDashboardGeneralSettings) => {
          set({ epiDashboardGeneralSettings: settings });
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
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        const validatedConfig = DashboardUtil.validateAndMigrateArrangementConfig(state.epiDashboardArrangementConfig);
        if (validatedConfig !== state.epiDashboardArrangementConfig) {
          state.setEpiDashboardArrangementConfig(validatedConfig);
        }
      },
      partialize: (state) => ({
        epiDashboardArrangementConfig: state.epiDashboardArrangementConfig,
        epiDashboardGeneralSettings: state.epiDashboardGeneralSettings,
        epiDashboardPanels: state.epiDashboardPanels,
        epiDashboardTreeSettings: state.epiDashboardTreeSettings,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 3,
    },
  ),
);
