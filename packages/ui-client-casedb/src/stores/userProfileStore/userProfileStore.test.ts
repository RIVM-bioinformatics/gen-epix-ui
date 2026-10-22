import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { FormUtil } from '@gen-epix/ui-core-form/utils/FormUtil';

import type { CaseDbConfig } from '../../models/config.models';
import { DASHBOARD_COMPONENT_NAME } from '../../constants/dashboard.constants';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';
import { DashboardUtil } from '../../utils/DashboardUtil';

import {
  createUserProfileStore,
  createUserProfileStoreInitialState,
} from './userProfileStore';

const createConfig = (): CaseDbConfig => ({
  ...CaseDbStandardConfigUtil.createConfig(),
  theme: createCaseDbDemoTheme('light'),
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem('GENEPIX-User-Profile');
});

describe('createUserProfileStoreInitialState', () => {
  it('creates dashboard defaults without sharing mutable widget configuration', () => {
    const config = createConfig();
    const initialState = createUserProfileStoreInitialState(config);
    const treeDefaults = config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.TREE].configDefaultValues;

    expect(initialState.dashboardArrangementConfig).toEqual(DashboardUtil.createDashboardArrangementConfigInitialState(config));
    expect(initialState.dashboardGeneralSettings).toEqual({ isHighlightingEnabled: true });
    expect(initialState.dashboardPanels).toEqual({});
    expect(initialState.dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.TREE]).toEqual(treeDefaults);
    expect(initialState.dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.TREE]).not.toBe(treeDefaults);
  });
});

describe('createUserProfileStore', () => {
  it('sets and resets general settings, layout, panels, and widget settings', () => {
    const config = createConfig();
    const store = createUserProfileStore(config);
    const arrangement = DashboardUtil.createDashboardArrangementConfigInitialState(config);

    store.getState().setDashboardGeneralSettings({ isHighlightingEnabled: false });
    store.getState().setDashboardPanelConfiguration('tree', 'collapsed');
    store.getState().setWidgetSettings(DASHBOARD_COMPONENT_NAME.TREE, { isShowDistancesEnabled: false });
    store.getState().setWidgetSettings(DASHBOARD_COMPONENT_NAME.MAP, { custom: true });

    expect(store.getState().dashboardGeneralSettings.isHighlightingEnabled).toBe(false);
    expect(store.getState().dashboardPanels).toEqual({ tree: 'collapsed' });
    expect(store.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.TREE]).toEqual({ isShowDistancesEnabled: false });

    store.getState().resetDashboardGeneralSettings();
    store.getState().resetWidgetSettings(DASHBOARD_COMPONENT_NAME.TREE);
    store.getState().resetWidgetSettings(DASHBOARD_COMPONENT_NAME.MAP);

    expect(store.getState().dashboardGeneralSettings).toEqual({ isHighlightingEnabled: true });
    expect(store.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.TREE]).toEqual(config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.TREE].configDefaultValues);
    expect(store.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.MAP]).toEqual({});

    store.getState().setDashboardArrangementConfig(arrangement);
    store.getState().resetDashboardLayout();

    expect(store.getState().dashboardArrangementConfig).toEqual(arrangement);
    expect(store.getState().dashboardPanels).toEqual({});
  });

  it('removes invalid assignments when setting a dashboard arrangement', () => {
    const config = createConfig();
    const store = createUserProfileStore(config);
    const arrangement = DashboardUtil.createDashboardArrangementConfigInitialState(config);
    const validArrangement = { ...arrangement };
    const removeInvalidWidgetAssignments = vi.spyOn(DashboardUtil, 'removeInvalidWidgetAssignments').mockReturnValue(validArrangement);

    store.getState().setDashboardArrangementConfig(arrangement);

    expect(removeInvalidWidgetAssignments).toHaveBeenCalledWith(arrangement, config.dashboard.WIDGETS, config);
    expect(store.getState().dashboardArrangementConfig).toBe(validArrangement);
  });

  it('rehydrates persisted settings, migrates layout, and resets invalid widget settings', async () => {
    const config = createConfig();
    const initialArrangement = DashboardUtil.createDashboardArrangementConfigInitialState(config);
    const migratedArrangement = { ...initialArrangement };
    localStorage.setItem('GENEPIX-User-Profile', JSON.stringify({
      state: {
        dashboardArrangementConfig: initialArrangement,
        dashboardGeneralSettings: { isHighlightingEnabled: false },
        dashboardPanels: { tree: 'collapsed' },
        dashboardWidgetSettings: {
          [DASHBOARD_COMPONENT_NAME.MAP]: { columnId: 'column-1' },
          [DASHBOARD_COMPONENT_NAME.TREE]: { invalid: true },
          missingWidget: { ignored: true },
        },
      },
      version: 4,
    }));
    vi.spyOn(DashboardUtil, 'validateAndMigrateArrangementConfig').mockReturnValue(migratedArrangement);
    vi.spyOn(DashboardUtil, 'removeInvalidWidgetAssignments').mockReturnValue(migratedArrangement);
    vi.spyOn(FormUtil, 'areFormValuesValid').mockImplementation((_fieldDefinitions, values) => {
      return !(values as { invalid?: boolean }).invalid;
    });
    const store = createUserProfileStore(config);

    await store.persist.rehydrate();

    expect(store.getState().dashboardArrangementConfig).toEqual(migratedArrangement);
    expect(store.getState().dashboardGeneralSettings).toEqual({ isHighlightingEnabled: false });
    expect(store.getState().dashboardPanels).toEqual({ tree: 'collapsed' });
    expect(store.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.MAP]).toEqual({ columnId: 'column-1' });
    expect(store.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.TREE]).toEqual(config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.TREE].configDefaultValues);
  });

  it('retains valid widget settings when rehydrating and keeps an unchanged layout', async () => {
    const config = createConfig();
    const arrangement = DashboardUtil.createDashboardArrangementConfigInitialState(config);
    const widgetSettings = { isShowDistancesEnabled: true, isShowSupportLinesWhenUnlinkedEnabled: false };
    localStorage.setItem('GENEPIX-User-Profile', JSON.stringify({
      state: {
        dashboardArrangementConfig: arrangement,
        dashboardGeneralSettings: { isHighlightingEnabled: false },
        dashboardPanels: {},
        dashboardWidgetSettings: {
          [DASHBOARD_COMPONENT_NAME.TREE]: widgetSettings,
        },
      },
      version: 4,
    }));
    const validateAndMigrateArrangementConfig = vi.spyOn(DashboardUtil, 'validateAndMigrateArrangementConfig')
      .mockImplementation(currentArrangement => currentArrangement);
    const removeInvalidWidgetAssignments = vi.spyOn(DashboardUtil, 'removeInvalidWidgetAssignments');
    const areFormValuesValid = vi.spyOn(FormUtil, 'areFormValuesValid').mockReturnValue(true);
    const store = createUserProfileStore(config);

    await store.persist.rehydrate();

    expect(validateAndMigrateArrangementConfig).toHaveBeenCalled();
    expect(removeInvalidWidgetAssignments).not.toHaveBeenCalled();
    expect(areFormValuesValid).toHaveBeenCalled();
    expect(store.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.TREE]).toEqual(widgetSettings);
  });

  it('uses an empty object when invalid widget settings have no configured defaults', async () => {
    const config = createConfig();
    config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.TREE].configDefaultValues = undefined;
    const arrangement = DashboardUtil.createDashboardArrangementConfigInitialState(config);
    localStorage.setItem('GENEPIX-User-Profile', JSON.stringify({
      state: {
        dashboardArrangementConfig: arrangement,
        dashboardGeneralSettings: { isHighlightingEnabled: false },
        dashboardPanels: {},
        dashboardWidgetSettings: {
          [DASHBOARD_COMPONENT_NAME.TREE]: { invalid: true },
        },
      },
      version: 4,
    }));
    vi.spyOn(DashboardUtil, 'validateAndMigrateArrangementConfig').mockImplementation(currentArrangement => currentArrangement);
    vi.spyOn(FormUtil, 'areFormValuesValid').mockReturnValue(false);
    const store = createUserProfileStore(config);

    await store.persist.rehydrate();

    expect(store.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.TREE]).toEqual({});
  });

  it('ignores a missing state when storage rehydration fails', async () => {
    const config = createConfig();
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const store = createUserProfileStore(config);

    await store.persist.rehydrate();

    expect(getItem).toHaveBeenCalled();
    expect(store.getState().dashboardGeneralSettings).toEqual({ isHighlightingEnabled: true });
  });
});
