import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';
import cloneDeep from 'lodash/cloneDeep';
import { FormUtil } from '@gen-epix/ui-core-form/utils/FormUtil';

import type { DashboardArrangementConfig } from '../../models/dashboard';
import { DashboardUtil } from '../../utils/DashboardUtil';
import type { CaseDbConfig } from '../../models/config';


export type DashboardGeneralSettings = {
  isHighlightingEnabled: boolean;
};


export type UserProfileStore = UserProfileStoreActions & UserProfileStoreState;

export interface UserProfileStoreActions {
  resetDashboardGeneralSettings: () => void;
  resetDashboardLayout: () => void;
  resetWidgetSettings: (widgetName: string) => void;
  setDashboardArrangementConfig: (config: DashboardArrangementConfig) => void;
  setDashboardGeneralSettings: (settings: DashboardGeneralSettings) => void;
  setDashboardPanelConfiguration: (id: string, configuration: string) => void;
  setWidgetSettings: (widgetName: string, settings: unknown) => void;
}

export interface UserProfileStoreState {
  dashboardArrangementConfig: DashboardArrangementConfig;
  dashboardGeneralSettings: DashboardGeneralSettings;
  dashboardPanels: {
    [key: string]: string;
  };
  dashboardWidgetSettings: {
    [key: string]: unknown;
  };
}

export const createUserProfileStoreInitialState = (config: CaseDbConfig): UserProfileStoreState => {
  const widgets = config.dashboard.WIDGETS;
  const dashboardWidgetSettings: UserProfileStoreState['dashboardWidgetSettings'] = {};
  for (const widgetName of Object.keys(widgets)) {
    dashboardWidgetSettings[widgetName] = cloneDeep(widgets[widgetName].configDefaultValues) ?? {};
  }

  return {
    dashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(config),
    dashboardGeneralSettings: {
      isHighlightingEnabled: true,
    },
    dashboardPanels: {},
    dashboardWidgetSettings,
  };
};

export const createUserProfileStore = (config: CaseDbConfig) => createStore<UserProfileStore>()(
  persist(
    (set, get) => {
      return {
        ...createUserProfileStoreInitialState(config),
        resetDashboardGeneralSettings: () => {
          set({
            dashboardGeneralSettings: {
              isHighlightingEnabled: true,
            },
          });
        },
        resetDashboardLayout: () => {
          set({
            dashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(config),
            dashboardPanels: {},
          });
        },
        resetWidgetSettings: (widgetName: string) => {
          const dashboardWidgetSettings = get().dashboardWidgetSettings;
          set({
            dashboardWidgetSettings: {
              ...dashboardWidgetSettings,
              [widgetName]: config.dashboard.WIDGETS[widgetName].configDefaultValues ?? {},
            },
          });
        },
        setDashboardArrangementConfig: (dashboardArrangementConfig: DashboardArrangementConfig) => {
          const widgetsConfig = config.dashboard.WIDGETS;
          set({ dashboardArrangementConfig: DashboardUtil.removeInvalidWidgetAssignments(dashboardArrangementConfig, widgetsConfig, config) });
        },
        setDashboardGeneralSettings: (settings: DashboardGeneralSettings) => {
          set({ dashboardGeneralSettings: settings });
        },
        setDashboardPanelConfiguration: (id: string, configuration: string) => {
          const dashboardPanels = get().dashboardPanels;
          set({
            dashboardPanels: {
              ...dashboardPanels,
              [id]: configuration,
            },
          });
        },
        setWidgetSettings: (widgetName: string, settings: unknown) => {
          const dashboardWidgetSettings = get().dashboardWidgetSettings;
          set({
            dashboardWidgetSettings: {
              ...dashboardWidgetSettings,
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
        const validatedConfig = DashboardUtil.validateAndMigrateArrangementConfig(state.dashboardArrangementConfig, config);
        if (validatedConfig !== state.dashboardArrangementConfig) {
          state.setDashboardArrangementConfig(validatedConfig);
        }

        const widgets = config.dashboard.WIDGETS;
        const initialWidgetSettings = createUserProfileStoreInitialState(config).dashboardWidgetSettings;
        for (const widgetName of Object.keys(state.dashboardWidgetSettings)) {
          const fieldDefs = widgets[widgetName]?.configFormFieldsDefinitions;
          if (!fieldDefs) {
            continue;
          }
          if (!FormUtil.areFormValuesValid(fieldDefs, state.dashboardWidgetSettings[widgetName])) {
            state.setWidgetSettings(widgetName, initialWidgetSettings[widgetName] ?? {});
          }
        }

      },
      partialize: (state) => ({
        dashboardArrangementConfig: state.dashboardArrangementConfig,
        dashboardGeneralSettings: state.dashboardGeneralSettings,
        dashboardPanels: state.dashboardPanels,
        dashboardWidgetSettings: state.dashboardWidgetSettings,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 4,
    },
  ),
);
