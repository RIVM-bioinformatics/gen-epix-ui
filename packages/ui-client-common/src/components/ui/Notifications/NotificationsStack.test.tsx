import { container } from 'tsyringe';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';

import { NotificationService } from '../../../classes/services/NotificationService';
import { renderComponent } from '../../../test/lib';

import { NotificationsStack } from './NotificationsStack';

const STACK_TEST_ID = 'NotificationsStack';

const getNotificationService = () => container.resolve(NotificationService);

describe('NotificationsStack', () => {
  afterEach(() => {
    getNotificationService().clearNotifications();
  });

  it('renders nothing when there are no notifications', async () => {
    const screen = await renderComponent(
      <NotificationsStack />,
    );

    await expect.element(screen.getByTestId(STACK_TEST_ID)).not.toBeInTheDocument();
  });

  it('shows visible notifications in the stack', async () => {
    const screen = await renderComponent(
      <NotificationsStack />,
    );

    getNotificationService().showNotification({ message: 'Upload complete', severity: 'success' });

    await expect.element(screen.getByTestId(STACK_TEST_ID)).toBeVisible();
    await expect.element(screen.getByText('Upload complete')).toBeVisible();
  });

  it('lists every visible notification', async () => {
    const screen = await renderComponent(
      <NotificationsStack />,
    );

    getNotificationService().showNotification({ message: 'First', severity: 'info' });
    getNotificationService().showNotification({ message: 'Second', severity: 'warning' });

    await expect.element(screen.getByText('First')).toBeVisible();
    await expect.element(screen.getByText('Second')).toBeVisible();
    expect(screen.getByTestId('NotificationItem').elements()).toHaveLength(2);
  });

  it('hides a notification from the stack when its close button is clicked', async () => {
    const screen = await renderComponent(
      <NotificationsStack />,
    );

    getNotificationService().showNotification({ message: 'Dismiss me', severity: 'info' });
    await expect.element(screen.getByText('Dismiss me')).toBeVisible();

    await screen.getByRole('button', { name: 'Clear notification' }).click();

    await expect.element(screen.getByTestId(STACK_TEST_ID)).not.toBeInTheDocument();
    expect(getNotificationService().data[0]?.visible).toBe(false);
  });

  it('keeps the stack open while another notification is still visible', async () => {
    const screen = await renderComponent(
      <NotificationsStack />,
    );

    getNotificationService().showNotification({ message: 'Keep open', severity: 'info' });
    getNotificationService().showNotification({ message: 'Dismiss', severity: 'info' });
    await expect.element(screen.getByText('Dismiss')).toBeVisible();

    await screen.getByRole('button', { name: 'Clear notification' }).first().click();

    await expect.element(screen.getByTestId(STACK_TEST_ID)).toBeVisible();
    await expect.element(screen.getByText('Keep open')).toBeVisible();
    await expect.element(screen.getByText('Dismiss')).not.toBeInTheDocument();
  });

  it('removes a notification from the stack after its auto-hide delay', async () => {
    const screen = await renderComponent(
      <NotificationsStack />,
    );

    getNotificationService().showNotification({ autoHideAfterMs: 50, message: 'Fades away', severity: 'info' });

    await expect.element(screen.getByText('Fades away')).toBeVisible();
    await expect.element(screen.getByTestId(STACK_TEST_ID)).not.toBeInTheDocument();
  });
});
