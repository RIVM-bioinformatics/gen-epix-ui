import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { createRef } from 'react';
import type {
  FunctionComponent,
  Ref,
} from 'react';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { DASHBOARD_ARRANGEMENT_ORIENTATION } from '../../../models/dashboard.models';
import type { DashboardArrangement } from '../../../models/dashboard.models';
import type { CaseDbConfig } from '../../../models/config.models';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { clearDashboardStorage } from '../../../test/fixtures/dashboard';
import { createCompleteCaseType } from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import type { ForwardRefDashboardLayoutRendererRefMethods } from './DashboardLayoutRenderer';
import { DashboardLayoutRenderer } from './DashboardLayoutRenderer';

const STORAGE_NAME_POST_FIX = 'DashboardLayoutRenderer';
const PANEL_STORAGE_PREFIX = 'epi-dashboard';
// Key under which the renderer stores a group's layout: the library reads `react-resizable-panels:<groupId>`, prefixed by the renderer.
const panelStorageKeyFor = (arrangementKey: string) => `${PANEL_STORAGE_PREFIX}-react-resizable-panels:${arrangementKey}-root`;

const ARRANGEMENT_FLAT = 'TEST_FLAT';
const ARRANGEMENT_NESTED = 'TEST_NESTED';
const ARRANGEMENT_MANY_GROUPS = 'TEST_MANY_GROUPS';
const ZONE_A = 'ZONE_A';
const ZONE_B = 'ZONE_B';
const ZONE_TOP = 'ZONE_TOP';
const ZONE_LEFT = 'ZONE_LEFT';
const ZONE_RIGHT = 'ZONE_RIGHT';

const WIDGET_A = 'TEST_WIDGET_A';
const WIDGET_B = 'TEST_WIDGET_B';
const WIDGET_THROWING = 'TEST_WIDGET_THROWING';
const WIDGET_A_TEXT = 'Test widget A content';
const WIDGET_B_TEXT = 'Test widget B content';
const WIDGET_A_LABEL = 'Test widget A';
const WIDGET_B_LABEL = 'Test widget B';
const WIDGET_THROWING_LABEL = 'Throwing widget';

const ADD_WIDGET_BUTTON_LABEL = 'Add a widget';
const VERTICAL_SEPARATOR_LABEL = 'Vertical separator';
const HORIZONTAL_SEPARATOR_LABEL = 'Horizontal separator';

const MANY_GROUP_COUNT = 17;

const createTextWidget = (text: string): FunctionComponent => () => (
  <div>
    {text}
  </div>
);
const createThrowingWidget = (): FunctionComponent => () => {
  throw new Error('Test widget failure');
};

const FLAT_ARRANGEMENT: DashboardArrangement = {
  cells: [
    { name: ZONE_A, size: 50 },
    { name: ZONE_B, size: 50 },
  ],
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
  size: 100,
};

const NESTED_ARRANGEMENT: DashboardArrangement = {
  cells: [
    { name: ZONE_TOP, size: 50 },
    {
      cells: [
        { name: ZONE_LEFT, size: 50 },
        { name: ZONE_RIGHT, size: 50 },
      ],
      orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
      size: 50,
    },
  ],
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
  size: 100,
};

// Each nested group is empty, so its layout is empty and reset skips it.
const MANY_GROUPS_ARRANGEMENT: DashboardArrangement = {
  cells: Array.from({ length: MANY_GROUP_COUNT }, (): DashboardArrangement => ({
    cells: [],
    orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
    size: 1,
  })),
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
  size: 100,
};

const createStores = () => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createCompleteCaseType(),
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  return { dashboardStore, userProfileStore };
};

type RenderLayoutOptions = {
  arrangementKey: string;
  disabled?: boolean;
  expandedZone?: string;
  ref?: Ref<ForwardRefDashboardLayoutRendererRefMethods>;
  storedPanels?: Record<string, string>;
  widgetAssignments?: Record<string, string>;
};

const renderLayout = async ({
  arrangementKey,
  disabled,
  expandedZone,
  ref,
  storedPanels = {},
  widgetAssignments = {},
}: RenderLayoutOptions) => {
  const { dashboardStore, userProfileStore } = createStores();
  userProfileStore.setState({
    dashboardArrangementConfig: { arrangementKey, arrangementWidgetAssignments: widgetAssignments },
    dashboardPanels: storedPanels,
  });
  if (expandedZone) {
    dashboardStore.getState().expandZone(expandedZone);
  }

  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardStoreContext value={dashboardStore}>
        <div style={{ height: 600, width: 800 }}>
          <DashboardLayoutRenderer
            disabled={disabled}
            ref={ref}
          />
        </div>
      </DashboardStoreContext>
    </UserProfileStoreContext>,
  );
  return { dashboardStore, screen, userProfileStore };
};

describe('DashboardLayoutRenderer', () => {
  let config: CaseDbConfig;
  let originalArrangementOptions: CaseDbConfig['dashboard']['ARRANGEMENT_OPTIONS'];
  let originalWidgets: CaseDbConfig['dashboard']['WIDGETS'];

  beforeEach(() => {
    config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    originalArrangementOptions = config.dashboard.ARRANGEMENT_OPTIONS;
    originalWidgets = config.dashboard.WIDGETS;
    clearDashboardStorage();
    config.dashboard.ARRANGEMENT_OPTIONS = {
      ...originalArrangementOptions,
      [ARRANGEMENT_FLAT]: FLAT_ARRANGEMENT,
      [ARRANGEMENT_MANY_GROUPS]: MANY_GROUPS_ARRANGEMENT,
      [ARRANGEMENT_NESTED]: NESTED_ARRANGEMENT,
    };
    config.dashboard.WIDGETS = {
      ...originalWidgets,
      [WIDGET_A]: { ...originalWidgets.EPI_CURVE, component: createTextWidget(WIDGET_A_TEXT), widgetLabel: WIDGET_A_LABEL },
      [WIDGET_B]: { ...originalWidgets.EPI_CURVE, component: createTextWidget(WIDGET_B_TEXT), widgetLabel: WIDGET_B_LABEL },
      [WIDGET_THROWING]: { ...originalWidgets.EPI_CURVE, component: createThrowingWidget(), widgetLabel: WIDGET_THROWING_LABEL },
    };
  });

  afterEach(() => {
    config.dashboard.ARRANGEMENT_OPTIONS = originalArrangementOptions;
    config.dashboard.WIDGETS = originalWidgets;
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders the widget assigned to each zone of a flat arrangement', async () => {
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      widgetAssignments: { [ZONE_A]: WIDGET_A, [ZONE_B]: WIDGET_B },
    });

    await expect.element(screen.getByText(WIDGET_A_TEXT)).toBeVisible();
    await expect.element(screen.getByText(WIDGET_B_TEXT)).toBeVisible();
    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL })).toBeVisible();
  });

  it('renders the placeholder for a zone without an assigned widget', async () => {
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      widgetAssignments: { [ZONE_A]: WIDGET_A },
    });

    await expect.element(screen.getByText(WIDGET_A_TEXT)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: ADD_WIDGET_BUTTON_LABEL })).toBeVisible();
  });

  it('renders nested groups with a separator in each group', async () => {
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_NESTED,
      widgetAssignments: { [ZONE_LEFT]: WIDGET_B, [ZONE_TOP]: WIDGET_A },
    });

    await expect.element(screen.getByText(WIDGET_A_TEXT)).toBeVisible();
    await expect.element(screen.getByText(WIDGET_B_TEXT)).toBeVisible();
    await expect.element(screen.getByRole('separator', { name: HORIZONTAL_SEPARATOR_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL })).toBeVisible();
  });

  it('renders only the expanded zone widget', async () => {
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      expandedZone: ZONE_A,
      widgetAssignments: { [ZONE_A]: WIDGET_A, [ZONE_B]: WIDGET_B },
    });

    await expect.element(screen.getByText(WIDGET_A_TEXT)).toBeVisible();
    expect(screen.getByText(WIDGET_B_TEXT).query()).toBeNull();
    expect(screen.getByRole('separator').query()).toBeNull();
  });

  it('renders nothing when the expanded zone has no assigned widget', async () => {
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      expandedZone: ZONE_B,
      widgetAssignments: { [ZONE_A]: WIDGET_A },
    });

    expect(screen.getByText(WIDGET_A_TEXT).query()).toBeNull();
    expect(screen.getByRole('button', { name: ADD_WIDGET_BUTTON_LABEL }).query()).toBeNull();
    expect(screen.getByRole('separator').query()).toBeNull();
  });

  it('renders nothing when the arrangement key is unknown', async () => {
    const { screen } = await renderLayout({
      arrangementKey: 'UNKNOWN_ARRANGEMENT',
      widgetAssignments: { [ZONE_A]: WIDGET_A },
    });

    expect(screen.getByText(WIDGET_A_TEXT).query()).toBeNull();
    expect(screen.getByRole('button', { name: ADD_WIDGET_BUTTON_LABEL }).query()).toBeNull();
    expect(screen.getByRole('separator').query()).toBeNull();
  });

  it('shows the widget unavailable message when a widget throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { screen } = await renderLayout({
        arrangementKey: ARRANGEMENT_FLAT,
        widgetAssignments: { [ZONE_A]: WIDGET_THROWING, [ZONE_B]: WIDGET_B },
      });

      await expect.element(screen.getByText(`The ${WIDGET_THROWING_LABEL} cannot be shown.`)).toBeVisible();
      await expect.element(screen.getByText(WIDGET_B_TEXT)).toBeVisible();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('disables the separators when the disabled prop is set', async () => {
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      disabled: true,
      widgetAssignments: { [ZONE_A]: WIDGET_A, [ZONE_B]: WIDGET_B },
    });

    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL })).toHaveAttribute('aria-disabled', 'true');
  });

  it('stores the panel layout when a separator is resized with the keyboard', async () => {
    const { screen, userProfileStore } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      widgetAssignments: { [ZONE_A]: WIDGET_A, [ZONE_B]: WIDGET_B },
    });

    await screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL }).click();
    await userEvent.keyboard('{ArrowRight}');

    await vi.waitFor(() => {
      expect(userProfileStore.getState().dashboardPanels[panelStorageKeyFor(ARRANGEMENT_FLAT)]).toBeDefined();
    });
  });

  it('restores the stored panel layout', async () => {
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      storedPanels: {
        [panelStorageKeyFor(ARRANGEMENT_FLAT)]: JSON.stringify({
          [`${ARRANGEMENT_FLAT}-root-panel-0`]: 30,
          [`${ARRANGEMENT_FLAT}-root-panel-1`]: 70,
        }),
      },
      widgetAssignments: { [ZONE_A]: WIDGET_A, [ZONE_B]: WIDGET_B },
    });

    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL })).toHaveAttribute('aria-valuenow', '30');
  });

  it('resets the panel layout to equal sizes through the ref', async () => {
    const ref = createRef<ForwardRefDashboardLayoutRendererRefMethods>();
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_FLAT,
      ref,
      storedPanels: {
        [panelStorageKeyFor(ARRANGEMENT_FLAT)]: JSON.stringify({
          [`${ARRANGEMENT_FLAT}-root-panel-0`]: 30,
          [`${ARRANGEMENT_FLAT}-root-panel-1`]: 70,
        }),
      },
      widgetAssignments: { [ZONE_A]: WIDGET_A, [ZONE_B]: WIDGET_B },
    });

    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL })).toHaveAttribute('aria-valuenow', '30');
    ref.current?.reset();
    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL })).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders and resets an arrangement with more groups than supported layout slots', async () => {
    const ref = createRef<ForwardRefDashboardLayoutRendererRefMethods>();
    const { screen } = await renderLayout({
      arrangementKey: ARRANGEMENT_MANY_GROUPS,
      ref,
    });

    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL }).first()).toBeVisible();
    ref.current?.reset();
    await expect.element(screen.getByRole('separator', { name: VERTICAL_SEPARATOR_LABEL }).first()).toBeVisible();
  });
});
