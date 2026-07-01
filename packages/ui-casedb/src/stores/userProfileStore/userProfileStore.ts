import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';
import {
  ConfigManager,
  FormUtil,
} from '@gen-epix/ui';

import type { EpiDashboardArrangementConfig } from '../../models/epi';
import { DashboardUtil } from '../../utils/DashboardUtil';
import type { CaseDbConfig } from '../../models/config';


export type EpiDashboardGeneralSettings = {
  isHighlightingEnabled: boolean;
};


export type UserProfileStore = UserProfileStoreActions & UserProfileStoreState;

export interface UserProfileStoreActions {
  resetEpiDashboardGeneralSettings: () => void;
  resetEpiDashboardLayout: () => void;
  resetWidgetSettings: (widgetName: string) => void;
  setEpiDashboardArrangementConfig: (config: EpiDashboardArrangementConfig) => void;
  setEpiDashboardGeneralSettings: (settings: EpiDashboardGeneralSettings) => void;
  setEpiDashboardPanelConfiguration: (id: string, configuration: string) => void;
  setWidgetSettings: (widgetName: string, settings: unknown) => void;
}

export interface UserProfileStoreState {
  epiDashboardArrangementConfig: EpiDashboardArrangementConfig;
  epiDashboardGeneralSettings: EpiDashboardGeneralSettings;
  epiDashboardPanels: {
    [key: string]: string;
  };
  epiDashboardWidgetSettings: {
    [key: string]: unknown;
  };
}

export const createUserProfileStoreInitialState: () => UserProfileStoreState = () => {
  const widgets = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.WIDGETS;
  const epiDashboardWidgetSettings: UserProfileStoreState['epiDashboardWidgetSettings'] = {};
  for (const widgetName of Object.keys(widgets)) {
    epiDashboardWidgetSettings[widgetName] = widgets[widgetName].configDefaultValues ?? {};
  }

  return {
    epiDashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(),
    epiDashboardGeneralSettings: {
      isHighlightingEnabled: true,
    },
    epiDashboardPanels: {},
    epiDashboardWidgetSettings,
    tableSettings: {},
  };
};

export const createUserProfileStore = () => createStore<UserProfileStore>()(
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
            epiDashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(),
            epiDashboardPanels: {},
          });
        },
        resetWidgetSettings: (widgetName: string) => {
          const epiDashboardWidgetSettings = get().epiDashboardWidgetSettings;
          set({
            epiDashboardWidgetSettings: {
              ...epiDashboardWidgetSettings,
              [widgetName]: ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.WIDGETS[widgetName].configDefaultValues ?? {},
            },
          });
        },
        setEpiDashboardArrangementConfig: (config: EpiDashboardArrangementConfig) => {
          set({ epiDashboardArrangementConfig: config });
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
        setWidgetSettings: (widgetName: string, settings: unknown) => {
          const epiDashboardWidgetSettings = get().epiDashboardWidgetSettings;
          set({
            epiDashboardWidgetSettings: {
              ...epiDashboardWidgetSettings,
              [widgetName]: settings,
            },
          });
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

        const widgets = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.WIDGETS;
        const initialWidgetSettings = createUserProfileStoreInitialState().epiDashboardWidgetSettings;
        for (const widgetName of Object.keys(state.epiDashboardWidgetSettings)) {
          const fieldDefs = widgets[widgetName]?.configFormFieldsDefinitions;
          if (!fieldDefs) {
            continue;
          }
          if (!FormUtil.areFormValuesValid(fieldDefs, state.epiDashboardWidgetSettings[widgetName])) {
            state.setWidgetSettings(widgetName, initialWidgetSettings[widgetName] ?? {});
          }
        }

      },
      partialize: (state) => ({
        epiDashboardArrangementConfig: state.epiDashboardArrangementConfig,
        epiDashboardGeneralSettings: state.epiDashboardGeneralSettings,
        epiDashboardPanels: state.epiDashboardPanels,
        epiDashboardWidgetSettings: state.epiDashboardWidgetSettings,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 4,
    },
  ),
);
