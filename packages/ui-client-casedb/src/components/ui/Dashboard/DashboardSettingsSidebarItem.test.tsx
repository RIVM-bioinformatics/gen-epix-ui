import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import type { PropsWithChildren } from 'react';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../../models/config.models';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { renderComponent } from '../../../test/lib';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';

import { DashboardSettingsSidebarItem } from './DashboardSettingsSidebarItem';
import type { DashboardSettingsSidebarItemProps } from './DashboardSettingsSidebarItem';

const LAYOUT_SECTION_LABEL = 'Dashboard layout';
const GENERAL_SECTION_LABEL = 'General';
const RESET_LAYOUT_BUTTON_LABEL = 'Reset dashboard layout';
const CLOSE_BUTTON_LABEL = 'Close settings';

/**
 * Provides a sized main content element that the sidebar measures, so the drawer has a non-zero height.
 */
const SettingsSidebarWrapper = ({ children, userProfileStore }: PropsWithChildren<{ readonly userProfileStore: ReturnType<typeof createUserProfileStore> }>) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  return (
    <UserProfileStoreContext value={userProfileStore}>
      <div
        id={config.layout.MAIN_CONTENT_ID}
        style={{
          height: '600px',
          left: 0,
          position: 'fixed',
          top: '60px',
          width: '400px',
        }}
      />
      {children}
    </UserProfileStoreContext>
  );
};

const renderSidebar = async (props: DashboardSettingsSidebarItemProps) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  return renderComponent(
    <SettingsSidebarWrapper userProfileStore={userProfileStore}>
      <DashboardSettingsSidebarItem {...props} />
    </SettingsSidebarWrapper>,
  );
};

describe('DashboardSettingsSidebarItem', () => {
  it('renders the layout, general and widget settings sections while open', async () => {
    const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    const screen = await renderSidebar({
      onClose: vi.fn(),
      onReset: vi.fn(),
      open: true,
    });

    await expect.element(screen.getByText('Settings', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: LAYOUT_SECTION_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: GENERAL_SECTION_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.EPI_CURVE].widgetLabel })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.TREE].widgetLabel })).toBeVisible();
  });

  it('does not render a settings section for widgets without configuration form fields', async () => {
    const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    const histogramLabel = config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.HISTOGRAM].widgetLabel;
    const screen = await renderSidebar({
      onClose: vi.fn(),
      onReset: vi.fn(),
      open: true,
    });

    await expect.element(screen.getByRole('heading', { name: LAYOUT_SECTION_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: histogramLabel })).not.toBeInTheDocument();
  });

  it('does not render the settings sections while closed', async () => {
    const screen = await renderSidebar({
      onClose: vi.fn(),
      onReset: vi.fn(),
      open: false,
    });

    await expect.element(screen.getByRole('heading', { name: LAYOUT_SECTION_LABEL })).not.toBeInTheDocument();
    await expect.element(screen.getByRole('heading', { name: GENERAL_SECTION_LABEL })).not.toBeInTheDocument();
  });

  it('calls onReset when the layout reset button is clicked', async () => {
    const onReset = vi.fn();
    const screen = await renderSidebar({
      onClose: vi.fn(),
      onReset,
      open: true,
    });

    await userEvent.click(screen.getByRole('button', { name: RESET_LAYOUT_BUTTON_LABEL }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const screen = await renderSidebar({
      onClose,
      onReset: vi.fn(),
      open: true,
    });

    await userEvent.click(screen.getByRole('button', { name: CLOSE_BUTTON_LABEL }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
