import { container } from 'tsyringe';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NotificationService } from '../../../classes/services/NotificationService';
import { renderComponent } from '../../../test/lib';

import { NotificationsDrawer } from './NotificationsDrawer';

const EMPTY_DRAWER_TEXT = 'No new notifications in this session';
const CLEAR_ALL_BUTTON_NAME = 'Clear all notifications';
const CLOSE_DRAWER_BUTTON_NAME = 'Close notifications drawer';

const getNotificationService = () => container.resolve(NotificationService);

describe('NotificationsDrawer', () => {
  afterEach(() => {
    getNotificationService().clearNotifications();
  });

  it('renders nothing when closed', async () => {
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={vi.fn()}
        open={false}
      />,
    );

    await expect.element(screen.getByText('Notifications', { exact: true })).not.toBeInTheDocument();
  });

  it('shows the empty state without a clear all button when there are no notifications', async () => {
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={vi.fn()}
        open
      />,
    );

    await expect.element(screen.getByText(EMPTY_DRAWER_TEXT)).toBeVisible();
    expect(screen.getByRole('button', { name: CLEAR_ALL_BUTTON_NAME }).query()).toBeNull();
  });

  it('lists all notifications and hides the empty state', async () => {
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={vi.fn()}
        open
      />,
    );

    getNotificationService().showNotification({ message: 'First export', severity: 'success' });
    getNotificationService().showNotification({ message: 'Second export', severity: 'error' });

    await expect.element(screen.getByText('First export')).toBeVisible();
    await expect.element(screen.getByText('Second export')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: CLEAR_ALL_BUTTON_NAME })).toBeVisible();
    expect(screen.getByText(EMPTY_DRAWER_TEXT).query()).toBeNull();
  });

  it('shows the time elapsed for each notification', async () => {
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={vi.fn()}
        open
      />,
    );

    getNotificationService().showNotification({ message: 'Just now', severity: 'info' });

    await expect.element(screen.getByText('less than a second ago')).toBeVisible();
  });

  it('calls onDrawerClose when the close icon button is clicked', async () => {
    const onDrawerClose = vi.fn();
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={onDrawerClose}
        open
      />,
    );

    await screen.getByRole('button', { name: CLOSE_DRAWER_BUTTON_NAME }).click();

    expect(onDrawerClose).toHaveBeenCalledOnce();
  });

  it('removes all notifications and closes the drawer when clear all is clicked', async () => {
    const onDrawerClose = vi.fn();
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={onDrawerClose}
        open
      />,
    );

    getNotificationService().showNotification({ message: 'First export', severity: 'success' });
    getNotificationService().showNotification({ message: 'Second export', severity: 'error' });
    await expect.element(screen.getByText('Second export')).toBeVisible();

    await screen.getByRole('button', { name: CLEAR_ALL_BUTTON_NAME }).click();

    expect(getNotificationService().data).toHaveLength(0);
    expect(onDrawerClose).toHaveBeenCalledOnce();
  });

  it('removes only the clicked notification', async () => {
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={vi.fn()}
        open
      />,
    );

    getNotificationService().showNotification({ message: 'Keep me', severity: 'info' });
    getNotificationService().showNotification({ message: 'Remove me', severity: 'warning' });
    await expect.element(screen.getByText('Remove me')).toBeVisible();

    await screen.getByRole('button', { name: 'Clear notification' }).first().click();

    await expect.element(screen.getByText('Keep me')).toBeVisible();
    await expect.element(screen.getByText('Remove me')).not.toBeInTheDocument();
    expect(getNotificationService().data.map(notification => notification.message)).toEqual(['Keep me']);
  });

  it('does not allow closing a loading notification', async () => {
    const screen = await renderComponent(
      <NotificationsDrawer
        onDrawerClose={vi.fn()}
        open
      />,
    );

    getNotificationService().showNotification({ isLoading: true, message: 'Exporting', severity: 'info' });

    await expect.element(screen.getByText('Exporting')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Clear notification' }).query()).toBeNull();
  });
});
