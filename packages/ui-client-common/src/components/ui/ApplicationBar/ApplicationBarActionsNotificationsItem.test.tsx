import { container } from 'tsyringe';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';

import { NotificationService } from '../../../classes/services/NotificationService';
import { renderComponent } from '../../../test/lib';

import { ApplicationBarActionsNotificationsItem } from './ApplicationBarActionsNotificationsItem';

const EMPTY_DRAWER_TEXT = 'No new notifications in this session';

const getNotificationService = () => container.resolve(NotificationService);

describe('ApplicationBarActionsNotificationsItem', () => {
  afterEach(() => {
    getNotificationService().clearNotifications();
  });

  it('renders the notifications button without a badge when there are no notifications', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    await expect.element(screen.getByTitle('Notifications')).toBeVisible();
    expect(document.querySelector('.MuiBadge-badge')?.textContent ?? '').toBe('');
    expect(screen.getByRole('progressbar').query()).toBeNull();
  });

  it('shows the number of notifications in the badge', async () => {
    await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    getNotificationService().showNotification({ message: 'First', severity: 'info' });
    getNotificationService().showNotification({ message: 'Second', severity: 'warning' });

    await expect.poll(() => document.querySelector('.MuiBadge-badge')?.textContent).toBe('2');
  });

  it('shows a progress indicator while a notification is loading', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    getNotificationService().showNotification({ isLoading: true, message: 'Loading', severity: 'info' });

    await expect.element(screen.getByRole('progressbar')).toBeVisible();
  });

  it('hides the progress indicator once no notification is loading', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    const loadingKey = getNotificationService().showNotification({ isLoading: true, message: 'Loading', severity: 'info' });
    await expect.element(screen.getByRole('progressbar')).toBeVisible();

    getNotificationService().clearNotification(loadingKey);

    await expect.poll(() => screen.getByRole('progressbar').query()).toBeNull();
  });

  it('hides the notification toasts but keeps the notifications when the button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    getNotificationService().showNotification({ message: 'Export finished', severity: 'success' });

    await screen.getByTitle('Notifications').click();

    await expect.poll(() => getNotificationService().data.every(x => !x.visible)).toBe(true);
    expect(getNotificationService().data).toHaveLength(1);
  });

  it('opens the notifications drawer when the button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    await screen.getByTitle('Notifications').click();

    await expect.element(screen.getByText(EMPTY_DRAWER_TEXT)).toBeVisible();
  });

  it('lists the notifications inside the drawer after opening it', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    getNotificationService().showNotification({ message: 'Export finished', severity: 'success' });

    await screen.getByTitle('Notifications').click();

    await expect.element(screen.getByRole('button', { name: 'Clear all notifications' })).toBeVisible();
    await expect.element(screen.getByText('Export finished')).toBeVisible();
    expect(screen.getByText(EMPTY_DRAWER_TEXT).query()).toBeNull();
  });

  it('closes the drawer when the close button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    await screen.getByTitle('Notifications').click();
    await expect.element(screen.getByText(EMPTY_DRAWER_TEXT)).toBeVisible();

    await screen.getByRole('button', { name: 'Close notifications drawer' }).click();

    await expect.poll(() => screen.getByText(EMPTY_DRAWER_TEXT).query()).toBeNull();
  });

  it('clears all notifications and closes the drawer when clear all is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsNotificationsItem />,
    );

    getNotificationService().showNotification({ message: 'Export finished', severity: 'success' });
    getNotificationService().showNotification({ message: 'Import failed', severity: 'error' });

    await screen.getByTitle('Notifications').click();
    await expect.element(screen.getByRole('button', { name: 'Clear all notifications' })).toBeVisible();

    await screen.getByRole('button', { name: 'Clear all notifications' }).click();

    await expect.poll(() => getNotificationService().data.length).toBe(0);
    await expect.poll(() => screen.getByText(EMPTY_DRAWER_TEXT).query()).toBeNull();
  });
});
