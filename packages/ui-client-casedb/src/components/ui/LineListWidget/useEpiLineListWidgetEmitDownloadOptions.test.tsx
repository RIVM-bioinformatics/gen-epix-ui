import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Mock } from 'vitest';
import { container } from 'tsyringe';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type {
  DownloadConfig,
  DownloadConfigItem,
  DownloadConfigSection,
} from '../../../classes/services/EventBusService';
import { EventBusService } from '../../../classes/services/EventBusService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { CaseDbConfig } from '../../../models/config.models';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { clearDashboardStorage } from '../../../test/fixtures/dashboard';
import { createLineListCompleteCaseType } from '../../../test/fixtures/lineListCompleteCaseType';
import { renderComponent } from '../../../test/lib';

import { useEpiLineListWidgetEmitDownloadOptions } from './useEpiLineListWidgetEmitDownloadOptions';

const STORAGE_NAME_POST_FIX = 'useEpiLineListWidgetEmitDownloadOptions';
const ALL_ROWS_LABEL = 'All rows';
const SELECTED_ROWS_LABEL = 'Selected rows';
const DOWNLOAD_AS_EXCEL_LABEL = 'Download as Excel';
const DOWNLOAD_AS_CSV_LABEL = 'Download as CSV';
const DOWNLOAD_SEQUENCES_LABEL = 'Download sequences';
const DOWNLOAD_ALLELE_PROFILES_LABEL = 'Download allele profiles';
const LINE_LIST_ZONE_LABEL = 'Line list';
const VISIBLE_COLUMN_ID = 'visible-column';
const HIDDEN_COLUMN_ID = 'hidden-column';

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;
let removeListeners: (() => void)[] = [];

const createCase = (id: string): CaseDbCase => ({
  content: {},
  id,
  timed_at: null,
} as unknown as CaseDbCase);

const createTestDashboardStore = (sortedData: CaseDbCase[]) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createLineListCompleteCaseType(),
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  dashboardStore.setState({
    columnVisualSettingsUncondensed: [
      { id: VISIBLE_COLUMN_ID, isVisible: true, widthFlex: 1, widthPx: 100 },
      { id: HIDDEN_COLUMN_ID, isVisible: false, widthFlex: 1, widthPx: 100 },
    ],
    sortedData,
  });
  activeDashboardStore = dashboardStore;
  return dashboardStore;
};

const EmitDownloadOptionsHarness = (): null => {
  useEpiLineListWidgetEmitDownloadOptions();
  return null;
};

const renderHarness = async (dashboardStore: ReturnType<typeof createDashboardStore>) => {
  return renderComponent(
    <DashboardStoreContext value={dashboardStore}>
      <EmitDownloadOptionsHarness />
    </DashboardStoreContext>,
  );
};

const addListener = (eventName: 'onDownloadOptionsChanged' | 'openSequenceDownloadDialog') => {
  const listener = vi.fn();
  removeListeners.push(container.resolve(EventBusService).addEventListener(eventName, listener));
  return listener;
};

const getLastDownloadConfig = (listener: Mock) => listener.mock.lastCall?.[0] as DownloadConfig;

const getSection = (config: DownloadConfig, label: string) => {
  return (config.items as DownloadConfigSection[]).find((section) => section.label === label);
};

const getItem = (section: DownloadConfigSection | undefined, label: string) => {
  return section?.items.find((item: DownloadConfigItem) => item.label === label);
};

const invokeCallback = async (item: DownloadConfigItem | undefined) => {
  await Promise.resolve(item?.callback());
};

describe('useEpiLineListWidgetEmitDownloadOptions', () => {
  afterEach(() => {
    removeListeners.forEach((removeListener) => removeListener());
    removeListeners = [];
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('emits the all rows and selected rows download options on mount', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1'), createCase('case-2')]);
    const listener = addListener('onDownloadOptionsChanged');

    await renderHarness(dashboardStore);

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });
    const config = getLastDownloadConfig(listener);
    expect(config.zone).toBe(DASHBOARD_COMPONENT_NAME.LINE_LIST);
    expect(config.zoneLabel).toBe(LINE_LIST_ZONE_LABEL);
    const allRows = getSection(config, ALL_ROWS_LABEL);
    expect(allRows?.disabled).toBe(false);
    expect(allRows?.items.map((item) => item.label)).toEqual([
      DOWNLOAD_AS_EXCEL_LABEL,
      DOWNLOAD_AS_CSV_LABEL,
      DOWNLOAD_SEQUENCES_LABEL,
      DOWNLOAD_ALLELE_PROFILES_LABEL,
    ]);
    expect(getItem(allRows, DOWNLOAD_ALLELE_PROFILES_LABEL)?.disabled).toBe(true);
    expect(getSection(config, SELECTED_ROWS_LABEL)?.disabled).toBe(true);
  });

  it('disables the all rows download options when there is no sorted data', async () => {
    const dashboardStore = createTestDashboardStore([]);
    const listener = addListener('onDownloadOptionsChanged');

    await renderHarness(dashboardStore);

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });
    expect(getSection(getLastDownloadConfig(listener), ALL_ROWS_LABEL)?.disabled).toBe(true);
  });

  it('re-emits the selected rows download options when the selection changes', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1'), createCase('case-2')]);
    const listener = addListener('onDownloadOptionsChanged');
    await renderHarness(dashboardStore);
    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });

    dashboardStore.getState().setSelectedIds(['case-2']);

    await vi.waitFor(() => {
      expect(getSection(getLastDownloadConfig(listener), SELECTED_ROWS_LABEL)?.disabled).toBe(false);
    });
  });

  it('re-emits the download options when the sorted data changes', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1')]);
    const listener = addListener('onDownloadOptionsChanged');
    await renderHarness(dashboardStore);
    await vi.waitFor(() => {
      expect(getSection(getLastDownloadConfig(listener), ALL_ROWS_LABEL)?.disabled).toBe(false);
    });

    dashboardStore.setState({ sortedData: [] });

    await vi.waitFor(() => {
      expect(getSection(getLastDownloadConfig(listener), ALL_ROWS_LABEL)?.disabled).toBe(true);
    });
  });

  it('re-emits the download options when they are requested', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1')]);
    const listener = addListener('onDownloadOptionsChanged');
    await renderHarness(dashboardStore);
    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledTimes(1);
    });

    container.resolve(EventBusService).emit('onDownloadOptionsRequested');

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  it('emits the sequence download dialog for all rows and selected rows', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1'), createCase('case-2')]);
    const downloadListener = addListener('onDownloadOptionsChanged');
    const sequenceDialogListener = addListener('openSequenceDownloadDialog');
    await renderHarness(dashboardStore);
    await vi.waitFor(() => {
      expect(downloadListener).toHaveBeenCalled();
    });

    await invokeCallback(getItem(getSection(getLastDownloadConfig(downloadListener), ALL_ROWS_LABEL), DOWNLOAD_SEQUENCES_LABEL));
    expect(sequenceDialogListener).toHaveBeenLastCalledWith({ cases: [createCase('case-1'), createCase('case-2')] });

    dashboardStore.getState().setSelectedIds(['case-2']);
    await vi.waitFor(() => {
      expect(getSection(getLastDownloadConfig(downloadListener), SELECTED_ROWS_LABEL)?.disabled).toBe(false);
    });

    await invokeCallback(getItem(getSection(getLastDownloadConfig(downloadListener), SELECTED_ROWS_LABEL), DOWNLOAD_SEQUENCES_LABEL));
    expect(sequenceDialogListener).toHaveBeenLastCalledWith({ cases: [expect.objectContaining({ id: 'case-2' })] });
  });

  it('runs the excel and csv download callbacks for all rows and selected rows', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1'), createCase('case-2')]);
    dashboardStore.getState().setSelectedIds(['case-1']);
    const listener = addListener('onDownloadOptionsChanged');
    await renderHarness(dashboardStore);
    await vi.waitFor(() => {
      expect(getSection(getLastDownloadConfig(listener), SELECTED_ROWS_LABEL)?.disabled).toBe(false);
    });
    const config = getLastDownloadConfig(listener);

    await invokeCallback(getItem(getSection(config, ALL_ROWS_LABEL), DOWNLOAD_AS_EXCEL_LABEL));
    await invokeCallback(getItem(getSection(config, ALL_ROWS_LABEL), DOWNLOAD_AS_CSV_LABEL));
    await invokeCallback(getItem(getSection(config, SELECTED_ROWS_LABEL), DOWNLOAD_AS_EXCEL_LABEL));
    await invokeCallback(getItem(getSection(config, SELECTED_ROWS_LABEL), DOWNLOAD_AS_CSV_LABEL));
    const allRowsAlleleProfiles = getItem(getSection(config, ALL_ROWS_LABEL), DOWNLOAD_ALLELE_PROFILES_LABEL);
    const selectedRowsAlleleProfiles = getItem(getSection(config, SELECTED_ROWS_LABEL), DOWNLOAD_ALLELE_PROFILES_LABEL);
    expect(allRowsAlleleProfiles?.disabled).toBe(true);
    expect(selectedRowsAlleleProfiles?.disabled).toBe(true);
    expect(allRowsAlleleProfiles?.callback()).toBeNull();
    expect(selectedRowsAlleleProfiles?.callback()).toBeNull();
  });

  it('removes the download options when unmounted', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1')]);
    const listener = addListener('onDownloadOptionsChanged');
    const screen = await renderHarness(dashboardStore);
    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });

    await screen.unmount();

    const config = getLastDownloadConfig(listener);
    expect(config.items).toBeNull();
    expect(config.zone).toBe(DASHBOARD_COMPONENT_NAME.LINE_LIST);
  });

  it('stops re-emitting download options after unmount', async () => {
    const dashboardStore = createTestDashboardStore([createCase('case-1')]);
    const listener = addListener('onDownloadOptionsChanged');
    const screen = await renderHarness(dashboardStore);
    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });
    await screen.unmount();
    const callCountAfterUnmount = listener.mock.calls.length;

    container.resolve(EventBusService).emit('onDownloadOptionsRequested');
    dashboardStore.getState().setSelectedIds(['case-1']);

    expect(listener).toHaveBeenCalledTimes(callCountAfterUnmount);
  });
});
