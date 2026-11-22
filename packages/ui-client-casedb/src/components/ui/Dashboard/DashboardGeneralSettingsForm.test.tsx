import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../../models/config.models';
import { clearDashboardStorage } from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

import { DashboardGeneralSettingsForm } from './DashboardGeneralSettingsForm';

const HIGHLIGHTING_SWITCH_LABEL = 'Enable highlighting across widgets';
const RESET_BUTTON_LABEL = 'Reset general settings';

const createStore = () => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  return createUserProfileStore(config);
};

const renderForm = async (store: ReturnType<typeof createStore>) => {
  return renderComponent(
    <UserProfileStoreContext value={store}>
      <DashboardGeneralSettingsForm />
    </UserProfileStoreContext>,
  );
};

describe('DashboardGeneralSettingsForm', () => {
  beforeEach(() => {
    clearDashboardStorage();
  });

  afterEach(() => {
    clearDashboardStorage();
  });

  it('renders the highlighting switch as checked by default', async () => {
    const store = createStore();
    const screen = await renderForm(store);

    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).toBeChecked();
  });

  it('renders the reset button', async () => {
    const store = createStore();
    const screen = await renderForm(store);

    await expect.element(screen.getByRole('button', { name: RESET_BUTTON_LABEL })).toBeVisible();
  });

  it('stores the switch value when the switch is toggled', async () => {
    const store = createStore();
    const screen = await renderForm(store);

    await screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL }).click();

    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).not.toBeChecked();
    await vi.waitFor(() => {
      expect(store.getState().dashboardGeneralSettings.isHighlightingEnabled).toBe(false);
    });
  });

  it('shows the switch as unchecked when the stored setting is disabled', async () => {
    const store = createStore();
    store.getState().setDashboardGeneralSettings({ isHighlightingEnabled: false });
    const screen = await renderForm(store);

    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).not.toBeChecked();
  });

  it('updates the switch when the stored setting changes', async () => {
    const store = createStore();
    const screen = await renderForm(store);
    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).toBeChecked();

    store.getState().setDashboardGeneralSettings({ isHighlightingEnabled: false });

    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).not.toBeChecked();
  });

  it('restores the default settings when the reset button is clicked', async () => {
    const store = createStore();
    store.getState().setDashboardGeneralSettings({ isHighlightingEnabled: false });
    const screen = await renderForm(store);
    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).not.toBeChecked();

    await screen.getByRole('button', { name: RESET_BUTTON_LABEL }).click();

    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).toBeChecked();
    await vi.waitFor(() => {
      expect(store.getState().dashboardGeneralSettings.isHighlightingEnabled).toBe(true);
    });
  });

  it('keeps the settings unchanged when the form is submitted', async () => {
    const store = createStore();
    const screen = await renderForm(store);
    const form = screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL }).element().closest<HTMLFormElement>('form');

    // A dispatched submit event reaches React's onSubmit without the browser navigating away
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await expect.element(screen.getByRole('switch', { name: HIGHLIGHTING_SWITCH_LABEL })).toBeChecked();
    expect(store.getState().dashboardGeneralSettings.isHighlightingEnabled).toBe(true);
  });
});
