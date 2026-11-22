import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../../models/config.models';
import { DASHBOARD_ARRANGEMENT_ORIENTATION } from '../../../models/dashboard.models';
import type { DashboardArrangement } from '../../../models/dashboard.models';
import { createUserProfileStore } from '../../../stores/userProfileStore/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { clearDashboardStorage } from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';

import { DashboardWidgetPlaceHolder } from './DashboardWidgetPlaceHolder';
import { DashboardZoneContext } from './DashboardZoneContext';

const ARRANGEMENT_KEY = 'TEST_DASHBOARD_WIDGET_PLACEHOLDER';
const ZONE_A = 'ZONE_A';
const ZONE_B = 'ZONE_B';
const WIDGET_A = 'TEST_WIDGET_A';
const WIDGET_B = 'TEST_WIDGET_B';
const WIDGET_A_LABEL = 'Widget A';
const WIDGET_B_LABEL = 'Widget B';
const ADD_WIDGET_LABEL = 'Add a widget';
const NO_WIDGETS_LABEL = 'No widgets available';

const TWO_ZONE_ARRANGEMENT: DashboardArrangement = {
  cells: [
    { name: ZONE_A, size: 50 },
    { name: ZONE_B, size: 50 },
  ],
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
  size: 100,
};

const renderPlaceHolder = async ({
  assignments,
  zoneName,
}: {
  readonly assignments: Record<string, null | string>;
  readonly zoneName: null | string;
}) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  userProfileStore.setState({
    dashboardArrangementConfig: { arrangementKey: ARRANGEMENT_KEY, arrangementWidgetAssignments: assignments },
  });
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardZoneContext value={zoneName}>
        <div style={{ height: 300, width: 600 }}>
          <DashboardWidgetPlaceHolder />
        </div>
      </DashboardZoneContext>
    </UserProfileStoreContext>,
  );
  return { screen, userProfileStore };
};

describe('DashboardWidgetPlaceHolder', () => {
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
      [WIDGET_A]: { ...originalWidgets.EPI_CURVE, constraints: [], widgetLabel: WIDGET_A_LABEL },
      [WIDGET_B]: { ...originalWidgets.EPI_CURVE, constraints: [], widgetLabel: WIDGET_B_LABEL },
    };
    clearDashboardStorage();
  });

  afterEach(() => {
    config.dashboard.ARRANGEMENT_OPTIONS = originalArrangementOptions;
    config.dashboard.WIDGETS = originalWidgets;
    clearDashboardStorage();
  });

  it('lists the widgets that are not assigned to another zone', async () => {
    const { screen } = await renderPlaceHolder({
      assignments: { [ZONE_A]: null, [ZONE_B]: WIDGET_B },
      zoneName: ZONE_A,
    });

    await screen.getByRole('button', { name: ADD_WIDGET_LABEL }).click();

    await expect.element(screen.getByRole('menuitem', { name: WIDGET_A_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: NO_WIDGETS_LABEL })).not.toBeInTheDocument();
  });

  it('assigns the selected widget to the zone when a menu item is clicked', async () => {
    const { screen, userProfileStore } = await renderPlaceHolder({
      assignments: { [ZONE_A]: null, [ZONE_B]: WIDGET_B },
      zoneName: ZONE_A,
    });

    await screen.getByRole('button', { name: ADD_WIDGET_LABEL }).click();
    await screen.getByRole('menuitem', { name: WIDGET_A_LABEL }).click();

    expect(userProfileStore.getState().dashboardArrangementConfig.arrangementWidgetAssignments).toEqual({
      [ZONE_A]: WIDGET_A,
      [ZONE_B]: WIDGET_B,
    });
    await expect.element(screen.getByRole('menuitem', { name: WIDGET_A_LABEL })).not.toBeInTheDocument();
  });

  it('shows a disabled message when no widgets are available for the zone', async () => {
    config.dashboard.WIDGETS = { [WIDGET_A]: config.dashboard.WIDGETS[WIDGET_A] };
    const { screen } = await renderPlaceHolder({
      assignments: { [ZONE_A]: null, [ZONE_B]: WIDGET_A },
      zoneName: ZONE_A,
    });

    await screen.getByRole('button', { name: ADD_WIDGET_LABEL }).click();

    await expect.element(screen.getByRole('menuitem', { name: NO_WIDGETS_LABEL })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: WIDGET_A_LABEL })).not.toBeInTheDocument();
  });

  it('shows a disabled message and no widgets when rendered outside a zone', async () => {
    const { screen, userProfileStore } = await renderPlaceHolder({
      assignments: { [ZONE_A]: null, [ZONE_B]: null },
      zoneName: null,
    });

    await screen.getByRole('button', { name: ADD_WIDGET_LABEL }).click();

    await expect.element(screen.getByRole('menuitem', { name: NO_WIDGETS_LABEL })).toHaveAttribute('aria-disabled', 'true');
    expect(userProfileStore.getState().dashboardArrangementConfig.arrangementWidgetAssignments).toEqual({
      [ZONE_A]: null,
      [ZONE_B]: null,
    });
  });

  it('closes the menu without selecting a widget when the menu is dismissed', async () => {
    const { screen, userProfileStore } = await renderPlaceHolder({
      assignments: { [ZONE_A]: null, [ZONE_B]: WIDGET_B },
      zoneName: ZONE_A,
    });

    await screen.getByRole('button', { name: ADD_WIDGET_LABEL }).click();
    await expect.element(screen.getByRole('menuitem', { name: WIDGET_A_LABEL })).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('menuitem', { name: WIDGET_A_LABEL })).not.toBeInTheDocument();
    expect(userProfileStore.getState().dashboardArrangementConfig.arrangementWidgetAssignments).toEqual({
      [ZONE_A]: null,
      [ZONE_B]: WIDGET_B,
    });
  });
});
