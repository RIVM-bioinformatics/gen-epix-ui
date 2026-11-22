import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../../models/config.models';
import { DASHBOARD_ARRANGEMENT_ORIENTATION } from '../../../models/dashboard.models';
import type { DashboardArrangement } from '../../../models/dashboard.models';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createUserProfileStore } from '../../../stores/userProfileStore/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { createCompleteCaseType } from '../../../test/fixtures/completeCaseType';
import { clearDashboardStorage } from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';

import { DashboardWidget } from './DashboardWidget';
import type { DashboardWidgetProps } from './DashboardWidget';
import { DashboardZoneContext } from './DashboardZoneContext';

const ARRANGEMENT_KEY = 'TEST_DASHBOARD_WIDGET';
const ZONE_A = 'ZONE_A';
const ZONE_B = 'ZONE_B';
const WIDGET_A = 'TEST_WIDGET_A';
const WIDGET_B = 'TEST_WIDGET_B';
const STORAGE_NAME_POST_FIX = 'DashboardWidget';

const WIDGET_TITLE = 'Widget title';
const WIDGET_CONTENT = 'Widget content';
const EXPAND_LABEL = 'Expand';
const COLLAPSE_LABEL = 'Collapse';
const REMOVE_LABEL = 'Remove widget';
const LOADING_LABEL = 'Loading';
const WARNING_MESSAGE = 'Widget warning message';
const ELEMENT_TITLE = 'Element title';
const MENU_TITLE = 'Menu title';
const PRIMARY_ACTION_LABEL = 'Primary action';
const SECONDARY_GROUP_LABEL = 'Secondary group';
const CUSTOM_PRIMARY_TEXT = 'Custom primary menu';

const TWO_ZONE_ARRANGEMENT: DashboardArrangement = {
  cells: [
    { name: ZONE_A, size: 50 },
    { name: ZONE_B, size: 50 },
  ],
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
  size: 100,
};

type RenderWidgetOptions = {
  readonly assignments?: Record<string, null | string>;
} & DashboardWidgetProps;

const renderWidget = async ({ assignments = { [ZONE_A]: WIDGET_A, [ZONE_B]: WIDGET_B }, ...widgetProps }: RenderWidgetOptions) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  userProfileStore.setState({
    dashboardArrangementConfig: { arrangementKey: ARRANGEMENT_KEY, arrangementWidgetAssignments: assignments },
  });
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createCompleteCaseType(),
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardStoreContext value={dashboardStore}>
        <DashboardZoneContext value={ZONE_A}>
          <div style={{ height: 300, width: 600 }}>
            <DashboardWidget {...widgetProps} />
          </div>
        </DashboardZoneContext>
      </DashboardStoreContext>
    </UserProfileStoreContext>,
  );
  return { dashboardStore, screen, userProfileStore };
};

describe('DashboardWidget', () => {
  let config: CaseDbConfig;
  let originalArrangementOptions: CaseDbConfig['dashboard']['ARRANGEMENT_OPTIONS'];
  let originalWidgets: CaseDbConfig['dashboard']['WIDGETS'];

  beforeEach(() => {
    config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    originalArrangementOptions = config.dashboard.ARRANGEMENT_OPTIONS;
    originalWidgets = config.dashboard.WIDGETS;
    config.dashboard.ARRANGEMENT_OPTIONS = {
      ...originalArrangementOptions,
      [ARRANGEMENT_KEY]: TWO_ZONE_ARRANGEMENT,
    };
    config.dashboard.WIDGETS = {
      ...originalWidgets,
      [WIDGET_A]: { ...originalWidgets.EPI_CURVE, widgetLabel: 'Widget A' },
      [WIDGET_B]: { ...originalWidgets.EPI_CURVE, widgetLabel: 'Widget B' },
    };
    clearDashboardStorage();
  });

  afterEach(() => {
    config.dashboard.ARRANGEMENT_OPTIONS = originalArrangementOptions;
    config.dashboard.WIDGETS = originalWidgets;
    clearDashboardStorage();
  });

  it('renders a string title as a heading and the children when not loading', async () => {
    const { screen } = await renderWidget({
      children: (
        <div>
          {WIDGET_CONTENT}
        </div>
      ),
      title: WIDGET_TITLE,
    });

    await expect.element(screen.getByRole('heading', { name: WIDGET_TITLE })).toBeVisible();
    await expect.element(screen.getByText(WIDGET_CONTENT)).toBeVisible();
  });

  it('renders a React element title as provided', async () => {
    const { screen } = await renderWidget({
      children: null,
      title: (
        <span>
          {ELEMENT_TITLE}
        </span>
      ),
    });

    await expect.element(screen.getByText(ELEMENT_TITLE, { exact: true })).toBeVisible();
  });

  it('renders a menu item title as a dropdown', async () => {
    const { screen } = await renderWidget({
      children: null,
      title: {
        items: [{ callback: vi.fn(), label: 'Nested item' }],
        label: MENU_TITLE,
      },
    });

    await expect.element(screen.getByText(MENU_TITLE, { exact: true })).toBeVisible();
  });

  it('renders the children without a title when the title is null', async () => {
    const { screen } = await renderWidget({
      children: (
        <div>
          {WIDGET_CONTENT}
        </div>
      ),
      title: null,
    });

    await expect.element(screen.getByText(WIDGET_CONTENT)).toBeVisible();
    expect(document.querySelector('h2')).toBeNull();
  });

  it('renders the primary menu actions and invokes their callback', async () => {
    const callback = vi.fn();
    const { screen } = await renderWidget({
      children: null,
      primaryMenu: [{ callback, label: PRIMARY_ACTION_LABEL }],
      title: WIDGET_TITLE,
    });

    await userEvent.click(screen.getByRole('button', { name: PRIMARY_ACTION_LABEL }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('renders a custom React node as the primary menu', async () => {
    const { screen } = await renderWidget({
      children: null,
      primaryMenu: (
        <span>
          {CUSTOM_PRIMARY_TEXT}
        </span>
      ),
      title: WIDGET_TITLE,
    });

    await expect.element(screen.getByText(CUSTOM_PRIMARY_TEXT, { exact: true })).toBeVisible();
  });

  it('renders a secondary menu group as a dropdown', async () => {
    const { screen } = await renderWidget({
      children: null,
      secondaryMenu: [{ items: [{ callback: vi.fn(), label: 'Nested item' }], label: SECONDARY_GROUP_LABEL }],
      title: WIDGET_TITLE,
    });

    await expect.element(screen.getByText(SECONDARY_GROUP_LABEL, { exact: true })).toBeVisible();
  });

  it('shows the expand button only when more than one widget is enabled and toggles the expanded zone', async () => {
    const { dashboardStore, screen } = await renderWidget({
      children: null,
      title: WIDGET_TITLE,
    });

    await userEvent.click(screen.getByRole('button', { name: EXPAND_LABEL }));
    expect(dashboardStore.getState().expandedZone).toBe(ZONE_A);
    await expect.element(screen.getByRole('button', { name: COLLAPSE_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: REMOVE_LABEL })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: COLLAPSE_LABEL }));
    expect(dashboardStore.getState().expandedZone).toBeNull();
    await expect.element(screen.getByRole('button', { name: REMOVE_LABEL })).toBeVisible();
  });

  it('disables the expand button when expandDisabled is set', async () => {
    const { screen } = await renderWidget({
      children: null,
      expandDisabled: true,
      title: WIDGET_TITLE,
    });

    await expect.element(screen.getByRole('button', { name: EXPAND_LABEL })).toBeDisabled();
  });

  it('hides the expand button when only one widget is enabled', async () => {
    const { screen } = await renderWidget({
      assignments: { [ZONE_A]: WIDGET_A, [ZONE_B]: null },
      children: null,
      title: WIDGET_TITLE,
    });

    await expect.element(screen.getByRole('button', { name: REMOVE_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: EXPAND_LABEL })).not.toBeInTheDocument();
  });

  it('removes the widget from its zone when the remove button is clicked', async () => {
    const { screen, userProfileStore } = await renderWidget({
      children: null,
      title: WIDGET_TITLE,
    });

    await userEvent.click(screen.getByRole('button', { name: REMOVE_LABEL }));
    const { arrangementWidgetAssignments } = userProfileStore.getState().dashboardArrangementConfig;
    expect(arrangementWidgetAssignments[ZONE_A]).toBeNull();
    expect(arrangementWidgetAssignments[ZONE_B]).toBe(WIDGET_B);
  });

  it('shows the warning message when one is provided', async () => {
    const { screen } = await renderWidget({
      children: (
        <div>
          {WIDGET_CONTENT}
        </div>
      ),
      title: WIDGET_TITLE,
      warningMessage: WARNING_MESSAGE,
    });

    await expect.element(screen.getByText(WARNING_MESSAGE)).toBeVisible();
    await expect.element(screen.getByText(WIDGET_CONTENT)).toBeVisible();
  });

  it('shows a spinner instead of the children while loading', async () => {
    const { screen } = await renderWidget({
      children: (
        <div>
          {WIDGET_CONTENT}
        </div>
      ),
      isLoading: true,
      title: WIDGET_TITLE,
    });

    await expect.element(screen.getByText(LOADING_LABEL, { exact: true })).toBeVisible();
    await expect.element(screen.getByText(WIDGET_CONTENT)).not.toBeInTheDocument();
  });
});
