import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { CaseDbConfig } from '../../../models/config.models';
import { createUserProfileStore } from '../../../stores/userProfileStore/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { clearDashboardStorage } from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';

import { DashboardWidgetSettingsForm } from './DashboardWidgetSettingsForm';

const INCLUDE_MISSING_VALUES_LABEL = 'Include missing values in area chart';
const INCLUDE_MISSING_VALUES_KEY = 'isIncludeMissingValuesInAreaChartEnabled';

const renderSettingsForm = async (widgetName: string) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardWidgetSettingsForm widgetName={widgetName} />
    </UserProfileStoreContext>,
  );
  return { screen, userProfileStore };
};

describe('DashboardWidgetSettingsForm', () => {
  beforeEach(() => {
    clearDashboardStorage();
  });

  it('renders the configurable fields of a widget with a form definition', async () => {
    const { screen } = await renderSettingsForm(DASHBOARD_COMPONENT_NAME.EPI_CURVE);

    await expect.element(screen.getByRole('switch', { name: INCLUDE_MISSING_VALUES_LABEL })).not.toBeChecked();
  });

  it('stores changes to a configurable field immediately', async () => {
    const { screen, userProfileStore } = await renderSettingsForm(DASHBOARD_COMPONENT_NAME.EPI_CURVE);

    await screen.getByRole('switch', { name: INCLUDE_MISSING_VALUES_LABEL }).click();

    await expect.element(screen.getByRole('switch', { name: INCLUDE_MISSING_VALUES_LABEL })).toBeChecked();
    expect(userProfileStore.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.EPI_CURVE]).toMatchObject({
      [INCLUDE_MISSING_VALUES_KEY]: true,
    });
  });

  it('restores the default settings when the reset button is clicked', async () => {
    const { screen, userProfileStore } = await renderSettingsForm(DASHBOARD_COMPONENT_NAME.EPI_CURVE);
    await screen.getByRole('switch', { name: INCLUDE_MISSING_VALUES_LABEL }).click();
    await expect.element(screen.getByRole('switch', { name: INCLUDE_MISSING_VALUES_LABEL })).toBeChecked();

    await screen.getByRole('button', { name: `Reset ${DASHBOARD_COMPONENT_NAME.EPI_CURVE} settings` }).click();

    await expect.element(screen.getByRole('switch', { name: INCLUDE_MISSING_VALUES_LABEL })).not.toBeChecked();
    expect(userProfileStore.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.EPI_CURVE]).toEqual({
      [INCLUDE_MISSING_VALUES_KEY]: false,
    });
  });

  it('renders no configurable fields for a widget without a form definition', async () => {
    const { screen } = await renderSettingsForm(DASHBOARD_COMPONENT_NAME.HISTOGRAM);

    await expect.element(screen.getByRole('button', { name: `Reset ${DASHBOARD_COMPONENT_NAME.HISTOGRAM} settings` })).toBeVisible();
    await expect.element(screen.getByRole('switch')).not.toBeInTheDocument();
  });

  it('resets a widget without default values to empty settings', async () => {
    const { screen, userProfileStore } = await renderSettingsForm(DASHBOARD_COMPONENT_NAME.HISTOGRAM);

    await screen.getByRole('button', { name: `Reset ${DASHBOARD_COMPONENT_NAME.HISTOGRAM} settings` }).click();

    expect(userProfileStore.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.HISTOGRAM]).toEqual({});
  });

  it('keeps the settings unchanged when the form is submitted', async () => {
    const { screen, userProfileStore } = await renderSettingsForm(DASHBOARD_COMPONENT_NAME.EPI_CURVE);
    await screen.getByRole('switch', { name: INCLUDE_MISSING_VALUES_LABEL }).click();
    const settingsBeforeSubmit = userProfileStore.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.EPI_CURVE];
    const form = document.querySelector<HTMLFormElement>('form');
    expect(form).not.toBeNull();
    form?.addEventListener('submit', (event) => event.preventDefault(), { once: true });

    form?.requestSubmit();

    expect(userProfileStore.getState().dashboardWidgetSettings[DASHBOARD_COMPONENT_NAME.EPI_CURVE]).toEqual(settingsBeforeSubmit);
  });
});
