import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';

import type { ConfigBase } from '../../../models/config.models';
import type { AuthenticationService } from '../AuthenticationService';
import type { LogService } from '../LogService';
import { TimeUtil } from '../../../utils/TimeUtil';

import { InactivityService } from './InactivityService';

const ACTIVITY_EVENT_NAMES = ['mousemove', 'keydown', 'scroll'] as const;

type ActivityEventName = typeof ACTIVITY_EVENT_NAMES[number];
type RegisteredListener = {
  eventName: ActivityEventName;
  listener: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
};

const activityListeners: RegisteredListener[] = [];

const createConfig = (allowedIdleTimeMs = 2000, notificationTimeMs = 1000): ConfigBase => ({
  userInactivityConfirmation: {
    ALLOWED_IDLE_TIME_MS: allowedIdleTimeMs,
    NOTIFICATION_TIME_MS: notificationTimeMs,
  },
} as ConfigBase);

const createService = (allowedIdleTimeMs = 2000, notificationTimeMs = 1000) => {
  const logService = {
    flushLog: vi.fn(),
    log: vi.fn(),
  } as unknown as LogService;
  const user = { id: 'test-user' };
  const signoutRedirect = vi.fn();
  const authenticationService = {
    authContextProps: {
      signoutRedirect,
      user,
    },
  } as unknown as AuthenticationService;
  const service = new InactivityService(
    createConfig(allowedIdleTimeMs, notificationTimeMs),
    logService,
    authenticationService,
  );

  return {
    logService,
    service,
    signoutRedirect,
    user,
  };
};

const isActivityEventName = (eventName: string): eventName is ActivityEventName =>
  ACTIVITY_EVENT_NAMES.some(activityEventName => activityEventName === eventName);

describe('InactivityService', () => {
  beforeEach(() => {
    activityListeners.length = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    vi.spyOn(TimeUtil, 'getReadableTimeRemaining').mockImplementation(milliseconds => `time:${milliseconds}`);

    const originalAddEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((eventName, listener, options) => {
      if (isActivityEventName(eventName)) {
        activityListeners.push({ eventName, listener, options });
      }
      originalAddEventListener(eventName, listener, options);
    });
  });

  afterEach(() => {
    for (const { eventName, listener, options } of activityListeners) {
      window.removeEventListener(eventName, listener, options);
    }
    activityListeners.length = 0;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes an idle state and subscribes to activity events', () => {
    const { service } = createService();

    expect(service.data).toEqual({
      idleDiff: 0,
      isIdle: false,
      notificationDiff: 0,
      readableIdleDiff: '',
      readableNotificationDiff: '',
    });
    expect(activityListeners.map(({ eventName }) => eventName)).toEqual(ACTIVITY_EVENT_NAMES);
  });

  it('publishes a reset state with readable time values', () => {
    const { service } = createService();
    const subscriber = vi.fn();
    service.subscribe(subscriber);

    service.reset();

    expect(service.data.idleDiff).toBe(0);
    expect(service.data.isIdle).toBe(false);
    expect(service.data.notificationDiff).toBe(0);
    expect(typeof service.data.readableIdleDiff).toBe('string');
    expect(typeof service.data.readableNotificationDiff).toBe('string');
    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('becomes idle only after the allowed idle-time boundary', () => {
    const { service } = createService(2000, 1000);

    vi.advanceTimersByTime(2000);
    expect(service.data.isIdle).toBe(false);

    vi.advanceTimersByTime(500);
    expect(service.data.isIdle).toBe(true);
    expect(service.data.idleDiff).toBe(2500);
    expect(service.data.notificationDiff).toBe(500);

    vi.advanceTimersByTime(500);
    expect(service.data.notificationDiff).toBe(0);
  });

  it('logs out after the notification period expires', () => {
    const { logService, service, signoutRedirect, user } = createService(2000, 1000);

    vi.advanceTimersByTime(3500);

    expect(logService.log).toHaveBeenCalledExactlyOnceWith([{
      detail: user,
      level: CommonDbLogLevel.TRACE,
      topic: 'USER_LOGOUT_BY_INACTIVITY',
    }]);
    expect(logService.flushLog).toHaveBeenCalledOnce();
    expect(signoutRedirect).toHaveBeenCalledOnce();
    expect(service.data.isIdle).toBe(true);
  });

  it('resets the idle deadline when activity occurs before becoming idle', () => {
    const { service } = createService(2000, 1000);

    vi.advanceTimersByTime(1500);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(1500);

    expect(service.data.isIdle).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(service.data.isIdle).toBe(true);
    expect(service.data.idleDiff).toBe(2500);
  });

  it('does not reset the deadline when activity occurs after becoming idle', () => {
    const { service } = createService(2000, 1000);
    vi.advanceTimersByTime(2500);
    expect(service.data.isIdle).toBe(true);

    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(500);

    expect(service.data.isIdle).toBe(true);
    expect(service.data.idleDiff).toBe(3000);
  });

  it('pauses idle detection and resumes from a reset deadline', () => {
    const { service } = createService(1000, 1000);

    service.pause();
    vi.advanceTimersByTime(2500);
    expect(service.data.isIdle).toBe(false);

    service.resume();
    vi.advanceTimersByTime(1000);
    expect(service.data.isIdle).toBe(false);
    vi.advanceTimersByTime(500);

    expect(service.data.isIdle).toBe(true);
    expect(service.data.idleDiff).toBe(1500);
  });

  it('does not start inactivity tracking when the initial timestamp is zero', () => {
    vi.setSystemTime(new Date(0));
    const { service } = createService(1000, 1000);

    vi.advanceTimersByTime(2000);

    expect(service.data.isIdle).toBe(false);
  });
});
