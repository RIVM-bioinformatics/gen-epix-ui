import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { Notification } from '../../../models/notification.models';
import { renderComponent } from '../../../test/lib';

import { NotificationItem } from './NotificationItem';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  key: 'notification-1',
  message: 'Export finished',
  severity: 'success',
  timestamp: new Date().getTime(),
  ...overrides,
});

describe('NotificationItem', () => {
  it('renders the message with the notification key as test id', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose
        notification={createNotification()}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId('NotificationItem')).toHaveTextContent('Export finished');
    await expect.element(screen.getByTestId('NotificationItem')).toHaveAttribute('data-testid-prop-key', 'notification-1');
  });

  it('applies the severity of the notification', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose
        notification={createNotification({ severity: 'warning' })}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId('NotificationItem')).toHaveClass('MuiAlert-colorWarning');
  });

  it('shows a progress indicator and uses info severity while loading', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose={false}
        notification={createNotification({ isLoading: true, severity: 'error' })}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByTestId('NotificationItem')).toHaveClass('MuiAlert-colorInfo');
  });

  it('shows no progress indicator when the notification is not loading', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose
        notification={createNotification()}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId('NotificationItem')).toBeVisible();
    expect(screen.getByRole('progressbar').query()).toBeNull();
  });

  it('shows a close button and calls onClose with the notification key when clicked', async () => {
    const onClose = vi.fn();
    const screen = await renderComponent(
      <NotificationItem
        allowClose
        notification={createNotification()}
        onClose={onClose}
      />,
    );

    await screen.getByRole('button', { name: 'Clear notification' }).click();

    expect(onClose).toHaveBeenCalledExactlyOnceWith('notification-1');
  });

  it('hides the close button when closing is not allowed', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose={false}
        notification={createNotification()}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId('NotificationItem')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Clear notification' }).query()).toBeNull();
  });

  it('does not show a timestamp by default', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose
        notification={createNotification({ timestamp: new Date().getTime() - TWO_HOURS_MS })}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByTestId('NotificationItem')).toBeVisible();
    expect(screen.getByText('ago').query()).toBeNull();
  });

  it('shows the time elapsed since the notification when showTimestamp is set', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose
        notification={createNotification({ timestamp: new Date().getTime() - TWO_HOURS_MS })}
        onClose={vi.fn()}
        showTimestamp
      />,
    );

    await expect.element(screen.getByText('more than 2 hours ago')).toBeVisible();
  });

  it('shows less than a second for a notification that was just created', async () => {
    const screen = await renderComponent(
      <NotificationItem
        allowClose
        notification={createNotification()}
        onClose={vi.fn()}
        showTimestamp
      />,
    );

    await expect.element(screen.getByText('less than a second ago')).toBeVisible();
  });
});
