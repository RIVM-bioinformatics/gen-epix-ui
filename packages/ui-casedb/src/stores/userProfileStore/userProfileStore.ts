import { createStore } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';
import {
  ConfigService,
  FormUtil,
} from '@gen-epix/ui';
import cloneDeep from 'lodash/cloneDeep';

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

export const createUserProfileStoreInitialState: () => UserProfileStoreState = () => {
  const widgets = ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS;
  const dashboardWidgetSettings: UserProfileStoreState['dashboardWidgetSettings'] = {};
  for (const widgetName of Object.keys(widgets)) {
    dashboardWidgetSettings[widgetName] = cloneDeep(widgets[widgetName].configDefaultValues) ?? {};
  }

  return {
    dashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(),
    dashboardGeneralSettings: {
      isHighlightingEnabled: true,
    },
    dashboardPanels: {},
    dashboardWidgetSettings,
    tableSettings: {},
  };
};

export const createUserProfileStore = () => createStore<UserProfileStore>()(
  persist(
    (set, get) => {
      return {
        ...createUserProfileStoreInitialState(),
        resetDashboardGeneralSettings: () => {
          set({
            dashboardGeneralSettings: {
              isHighlightingEnabled: true,
            },
          });
        },
        resetDashboardLayout: () => {
          set({
            dashboardArrangementConfig: DashboardUtil.createDashboardArrangementConfigInitialState(),
            dashboardPanels: {},
          });
        },
        resetWidgetSettings: (widgetName: string) => {
          const dashboardWidgetSettings = get().dashboardWidgetSettings;
          set({
            dashboardWidgetSettings: {
              ...dashboardWidgetSettings,
              [widgetName]: ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS[widgetName].configDefaultValues ?? {},
            },
          });
        },
        setDashboardArrangementConfig: (config: DashboardArrangementConfig) => {
          const widgetsConfig = ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS;
          set({ dashboardArrangementConfig: DashboardUtil.removeInvalidWidgetAssignments(config, widgetsConfig) });
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
        const validatedConfig = DashboardUtil.validateAndMigrateArrangementConfig(state.dashboardArrangementConfig);
        if (validatedConfig !== state.dashboardArrangementConfig) {
          state.setDashboardArrangementConfig(validatedConfig);
        }

        const widgets = ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS;
        const initialWidgetSettings = createUserProfileStoreInitialState().dashboardWidgetSettings;
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
