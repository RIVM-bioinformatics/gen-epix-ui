import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';

import { EventBusService } from '../../../classes/services/EventBusService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { CaseDbConfig } from '../../../models/config.models';
import type { TreeWidgetData } from '../../../models/dashboard.models';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { clearDashboardStorage } from '../../../test/fixtures/dashboard';
import {
  createLineListCompleteCaseType,
  SEX_COL_ID,
} from '../../../test/fixtures/lineListCompleteCaseType';
import { renderComponent } from '../../../test/lib';

import { LineListWidgetSecondaryMenu } from './LineListWidgetSecondaryMenu';

const STORAGE_NAME_POST_FIX = 'LineListWidgetSecondaryMenu';
const LINKED_ZOOM_LEVEL = 1;
const UNLINKED_ZOOM_LEVEL = 2;
const LINK_LABEL = 'Link Tree and Line List';
const UNLINK_LABEL = 'Unlink Tree and Line List';

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;
let removeListeners: (() => void)[] = [];

const setTreeZoomLevel = (zoomLevel: number) => {
  activeDashboardStore?.getState().updateWidgetData<TreeWidgetData>(DASHBOARD_COMPONENT_NAME.TREE, { zoomLevel });
};

const seedSexColumn = (dashboardStore: ReturnType<typeof createDashboardStore>) => {
  const columns = [
    TableUtil.createTextColumn<CaseDbCase, CaseDbCompleteCaseType>({ id: SEX_COL_ID as keyof CaseDbCase, name: 'Sex' }),
  ];
  dashboardStore.getState().setColumns(columns);
  dashboardStore.getState().setColumnVisualSettingsUncondensed(TableUtil.createInitialVisualColumnSettings(columns));
};

const renderSecondaryMenu = async (zoomLevel: number) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createLineListCompleteCaseType(),
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  activeDashboardStore = dashboardStore;
  seedSexColumn(dashboardStore);
  setTreeZoomLevel(zoomLevel);

  const screen = await renderComponent(
    <DashboardStoreContext value={dashboardStore}>
      <LineListWidgetSecondaryMenu />
    </DashboardStoreContext>,
  );
  return { dashboardStore, screen };
};

const addEventListenerSpy = (eventName: 'onLinkLineListAndTree' | 'onUnlinkLineListAndTree') => {
  const listener = vi.fn();
  removeListeners.push(container.resolve(EventBusService).addEventListener(eventName, listener));
  return listener;
};

describe('LineListWidgetSecondaryMenu', () => {
  beforeEach(() => {
    clearDashboardStorage();
  });

  afterEach(() => {
    removeListeners.forEach((removeListener) => removeListener());
    removeListeners = [];
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('shows the link action with the unlinked state when the tree is not linked', async () => {
    const { screen } = await renderSecondaryMenu(UNLINKED_ZOOM_LEVEL);

    await expect.element(screen.getByRole('button', { exact: true, name: LINK_LABEL })).toBeInTheDocument();
    await expect.element(screen.getByText('Unlinked', { exact: true })).toBeInTheDocument();
  });

  it('shows the unlink action with the linked state when the tree is linked', async () => {
    const { screen } = await renderSecondaryMenu(LINKED_ZOOM_LEVEL);

    await expect.element(screen.getByRole('button', { exact: true, name: UNLINK_LABEL })).toBeInTheDocument();
    await expect.element(screen.getByText('Linked', { exact: true })).toBeInTheDocument();
  });

  it('resets the sorting and emits the link event when linking the tree and line list', async () => {
    const linkListener = addEventListenerSpy('onLinkLineListAndTree');
    const unlinkListener = addEventListenerSpy('onUnlinkLineListAndTree');
    const { dashboardStore, screen } = await renderSecondaryMenu(UNLINKED_ZOOM_LEVEL);
    await dashboardStore.getState().setSorting(SEX_COL_ID, 'asc');

    await screen.getByRole('button', { exact: true, name: LINK_LABEL }).click();

    await vi.waitFor(() => {
      expect(linkListener).toHaveBeenCalledTimes(1);
    });
    expect(dashboardStore.getState().sortByField).toBeNull();
    expect(dashboardStore.getState().sortDirection).toBeNull();
    expect(unlinkListener).not.toHaveBeenCalled();
  });

  it('emits a user-initiated unlink event without changing the sorting when unlinking', async () => {
    const linkListener = addEventListenerSpy('onLinkLineListAndTree');
    const unlinkListener = addEventListenerSpy('onUnlinkLineListAndTree');
    const { dashboardStore, screen } = await renderSecondaryMenu(LINKED_ZOOM_LEVEL);
    await dashboardStore.getState().setSorting(SEX_COL_ID, 'asc');

    await screen.getByRole('button', { exact: true, name: UNLINK_LABEL }).click();

    expect(unlinkListener).toHaveBeenCalledWith({ userInitiated: true });
    expect(linkListener).not.toHaveBeenCalled();
    expect(dashboardStore.getState().sortByField).toBe(SEX_COL_ID);
    expect(dashboardStore.getState().sortDirection).toBe('asc');
  });

  it('updates the action and state when the tree link state changes', async () => {
    const { screen } = await renderSecondaryMenu(UNLINKED_ZOOM_LEVEL);
    await expect.element(screen.getByRole('button', { exact: true, name: LINK_LABEL })).toBeInTheDocument();

    setTreeZoomLevel(LINKED_ZOOM_LEVEL);

    await expect.element(screen.getByRole('button', { exact: true, name: UNLINK_LABEL })).toBeInTheDocument();
    await expect.element(screen.getByText('Linked', { exact: true })).toBeInTheDocument();
  });
});
