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

import { DashboardLayoutSettingsForm } from './DashboardLayoutSettingsForm';

const ARRANGEMENT_GROUP_LABEL = 'Arrangement';
const RESET_BUTTON_LABEL = 'Reset dashboard layout';
const DEFAULT_ARRANGEMENT_OPTION_LABEL = 'Option 1';
const SECOND_ARRANGEMENT_OPTION_LABEL = 'Option 2';

const createStore = () => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  return createUserProfileStore(config);
};

const renderForm = async (store: ReturnType<typeof createStore>, onReset: () => void = vi.fn()) => {
  return renderComponent(
    <UserProfileStoreContext value={store}>
      <DashboardLayoutSettingsForm onReset={onReset} />
    </UserProfileStoreContext>,
  );
};

describe('DashboardLayoutSettingsForm', () => {
  beforeEach(() => {
    clearDashboardStorage();
  });

  afterEach(() => {
    clearDashboardStorage();
  });

  it('renders the arrangement options with the default arrangement checked', async () => {
    const store = createStore();
    const screen = await renderForm(store);

    await expect.element(screen.getByRole('radiogroup', { name: ARRANGEMENT_GROUP_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).toBeChecked();
    await expect.element(screen.getByRole('radio', { name: SECOND_ARRANGEMENT_OPTION_LABEL })).not.toBeChecked();
  });

  it('renders the reset button', async () => {
    const store = createStore();
    const screen = await renderForm(store);

    await expect.element(screen.getByRole('button', { name: RESET_BUTTON_LABEL })).toBeVisible();
  });

  it('stores the selected arrangement and its widget assignments when another arrangement is selected', async () => {
    const store = createStore();
    const screen = await renderForm(store);

    await screen.getByRole('radio', { name: SECOND_ARRANGEMENT_OPTION_LABEL }).click();

    await expect.element(screen.getByRole('radio', { name: SECOND_ARRANGEMENT_OPTION_LABEL })).toBeChecked();
    await vi.waitFor(() => {
      expect(store.getState().dashboardArrangementConfig.arrangementKey).toBe('2');
    });
    expect(store.getState().dashboardArrangementConfig.arrangementWidgetAssignments).toBeDefined();
  });

  it('updates the selected radio when the stored arrangement changes', async () => {
    const store = createStore();
    const screen = await renderForm(store);
    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).toBeChecked();

    store.setState({
      dashboardArrangementConfig: {
        arrangementKey: '3',
        arrangementWidgetAssignments: store.getState().dashboardArrangementConfig.arrangementWidgetAssignments,
      },
    });

    await expect.element(screen.getByRole('radio', { name: 'Option 3' })).toBeChecked();
    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).not.toBeChecked();
  });

  it('keeps an empty stored arrangement key unchanged', async () => {
    const store = createStore();
    store.setState({
      dashboardArrangementConfig: {
        arrangementKey: '',
        arrangementWidgetAssignments: store.getState().dashboardArrangementConfig.arrangementWidgetAssignments,
      },
    });
    const screen = await renderForm(store);

    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).not.toBeChecked();
    expect(store.getState().dashboardArrangementConfig.arrangementKey).toBe('');
  });

  it('keeps an unknown stored arrangement key unchanged', async () => {
    const store = createStore();
    store.setState({
      dashboardArrangementConfig: {
        arrangementKey: 'unknown',
        arrangementWidgetAssignments: store.getState().dashboardArrangementConfig.arrangementWidgetAssignments,
      },
    });
    const screen = await renderForm(store);

    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).not.toBeChecked();
    expect(store.getState().dashboardArrangementConfig.arrangementKey).toBe('unknown');
  });

  it('restores the default arrangement and calls onReset when the reset button is clicked', async () => {
    const store = createStore();
    const onReset = vi.fn<() => void>();
    const screen = await renderForm(store, onReset);
    await screen.getByRole('radio', { name: SECOND_ARRANGEMENT_OPTION_LABEL }).click();
    await expect.element(screen.getByRole('radio', { name: SECOND_ARRANGEMENT_OPTION_LABEL })).toBeChecked();

    await screen.getByRole('button', { name: RESET_BUTTON_LABEL }).click();

    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).toBeChecked();
    await vi.waitFor(() => {
      expect(store.getState().dashboardArrangementConfig.arrangementKey).toBe('1');
    });
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('resets the layout without failing when no onReset callback is provided', async () => {
    const store = createStore();
    // The prop is typed as required; this covers the runtime guard for untyped callers
    const untypedProps = { onReset: undefined } as unknown as { onReset: () => void };
    const screen = await renderComponent(
      <UserProfileStoreContext value={store}>
        <DashboardLayoutSettingsForm {...untypedProps} />
      </UserProfileStoreContext>,
    );
    await screen.getByRole('radio', { name: SECOND_ARRANGEMENT_OPTION_LABEL }).click();
    await expect.element(screen.getByRole('radio', { name: SECOND_ARRANGEMENT_OPTION_LABEL })).toBeChecked();

    await screen.getByRole('button', { name: RESET_BUTTON_LABEL }).click();

    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).toBeChecked();
    await vi.waitFor(() => {
      expect(store.getState().dashboardArrangementConfig.arrangementKey).toBe('1');
    });
  });

  it('keeps the arrangement unchanged when the form is submitted', async () => {
    const store = createStore();
    const screen = await renderForm(store);
    const form = screen.getByRole('radiogroup', { name: ARRANGEMENT_GROUP_LABEL }).element().closest<HTMLFormElement>('form');

    // A dispatched submit event reaches React's onSubmit without the browser navigating away
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await expect.element(screen.getByRole('radio', { name: DEFAULT_ARRANGEMENT_OPTION_LABEL })).toBeChecked();
    expect(store.getState().dashboardArrangementConfig.arrangementKey).toBe('1');
  });
});
