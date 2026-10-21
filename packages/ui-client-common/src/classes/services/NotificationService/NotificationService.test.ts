import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';

import type { ConfigBase } from '../../../models/config.models';

import { NotificationService } from './NotificationService';

const createService = (defaultAutoHideAfterMs = 1000): NotificationService => new NotificationService({
  notifications: {
    autoHideAfterMs: defaultAutoHideAfterMs,
  },
} as ConfigBase);

describe('NotificationService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    let nextUuid = 0;
    vi.spyOn(StringUtil, 'createUuid').mockImplementation(() => `notification-${++nextUuid}`);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts with an empty notification list', () => {
    expect(createService().data).toEqual([]);
  });

  it('adds new notifications first with configured visibility and timestamps', () => {
    const service = createService(5000);
    const firstKey = service.showNotification({
      message: 'First',
      severity: 'info',
    });
    const secondKey = service.showNotification({
      message: 'Second',
      severity: 'success',
    });

    expect(firstKey).toBe('notification-1');
    expect(secondKey).toBe('notification-2');
    expect(service.data).toEqual([
      {
        autoHideAfterMs: 5000,
        key: secondKey,
        message: 'Second',
        severity: 'success',
        timestamp: Date.now(),
        visible: true,
      },
      {
        autoHideAfterMs: 5000,
        key: firstKey,
        message: 'First',
        severity: 'info',
        timestamp: Date.now(),
        visible: true,
      },
    ]);

    vi.advanceTimersByTime(5000);
    expect(service.data.every(notification => !notification.visible)).toBe(true);
  });

  it('uses the default timeout and hides a notification when it expires', () => {
    const service = createService(1000);
    const key = service.showNotification({
      message: 'Temporary',
      severity: 'info',
    });

    vi.advanceTimersByTime(999);
    expect(service.data.find(notification => notification.key === key)?.visible).toBe(true);

    vi.advanceTimersByTime(1);
    expect(service.data.find(notification => notification.key === key)?.visible).toBe(false);
  });

  it('uses zero as an immediate timeout', () => {
    const service = createService();
    const key = service.showNotification({
      autoHideAfterMs: 0,
      message: 'Immediate',
      severity: 'info',
    });

    vi.advanceTimersByTime(0);

    expect(service.data.find(notification => notification.key === key)?.visible).toBe(false);
  });

  it('does not schedule auto-hide for non-finite timeout values', () => {
    const service = createService();
    const persistentKey = service.showNotification({
      autoHideAfterMs: Number.POSITIVE_INFINITY,
      message: 'Persistent',
      severity: 'info',
    });
    const invalidTimeoutKey = service.showNotification({
      autoHideAfterMs: Number.NaN,
      message: 'Invalid timeout',
      severity: 'warning',
    });

    vi.advanceTimersByTime(10000);

    expect(service.data.find(notification => notification.key === persistentKey)?.visible).toBe(true);
    expect(service.data.find(notification => notification.key === invalidTimeoutKey)?.visible).toBe(true);
  });

  it('fulfills a matching notification and leaves other notifications unchanged', () => {
    const service = createService(Number.POSITIVE_INFINITY);
    const key = service.showNotification({
      isLoading: true,
      message: 'Loading',
      severity: 'info',
    });
    const otherKey = service.showNotification({
      message: 'Other',
      severity: 'warning',
    });

    service.fulfillNotification(key, 'Completed', 'success');
    service.fulfillNotification('missing', 'Missing', 'error');

    expect(service.data.find(notification => notification.key === key)).toMatchObject({
      isLoading: false,
      message: 'Completed',
      severity: 'success',
    });
    const otherNotification = service.data.find(notification => notification.key === otherKey);
    expect(otherNotification).toMatchObject({
      message: 'Other',
      severity: 'warning',
    });
    expect(otherNotification).not.toHaveProperty('isLoading');
  });

  it('hides all notifications without removing them', () => {
    const service = createService(Number.POSITIVE_INFINITY);
    service.showNotification({ message: 'First', severity: 'info' });
    service.showNotification({ message: 'Second', severity: 'success' });

    service.hideAllNotifications();

    expect(service.data).toHaveLength(2);
    expect(service.data.every(notification => !notification.visible)).toBe(true);

    service.clearNotifications();
    service.hideAllNotifications();
    expect(service.data).toEqual([]);
  });

  it('hides and clears a notification timeout while preserving other notifications', () => {
    const service = createService();
    const firstKey = service.showNotification({
      message: 'First',
      severity: 'info',
    });
    const secondKey = service.showNotification({
      autoHideAfterMs: Number.POSITIVE_INFINITY,
      message: 'Second',
      severity: 'success',
    });

    service.hideNotification(firstKey);
    service.hideNotification('missing');
    vi.advanceTimersByTime(2000);

    expect(service.data.find(notification => notification.key === firstKey)?.visible).toBe(false);
    expect(service.data.find(notification => notification.key === secondKey)?.visible).toBe(true);
  });

  it('removes an individual notification and cancels its timeout', () => {
    const service = createService();
    const key = service.showNotification({
      message: 'Remove me',
      severity: 'info',
    });

    service.clearNotification(key);
    service.clearNotification('missing');
    vi.advanceTimersByTime(2000);

    expect(service.data).toEqual([]);
  });

  it('clears all notifications and their timeouts', () => {
    const service = createService();
    service.showNotification({ message: 'First', severity: 'info' });
    service.showNotification({ message: 'Second', severity: 'error' });

    service.clearNotifications();
    service.clearNotifications();
    vi.advanceTimersByTime(2000);

    expect(service.data).toEqual([]);
  });
});
