import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';
import { useDebouncedCallback } from 'use-debounce';

import type { ConfirmationRefMethods } from '../Confirmation';
import { Confirmation } from '../Confirmation';
import { LogLevel } from '../../../api';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { TimeUtil } from '../../../utils/TimeUtil';

export const UserInactivityConfirmation = () => {
  const [t] = useTranslation();
  const auth = useAuth();
  const confirmation = useRef<ConfirmationRefMethods>(null);
  const idleIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const [idleSince, setIdleSince] = useState(Date.now());
  const [isIdle, setIsIdle] = useState(false);
  const [idleDiff, setIdleDiff] = useState(0);
  const [notificationDiff, setNotificationDiff] = useState(0);

  const { ALLOWED_IDLE_TIME_MS, NOTIFICATION_TIME_MS } = ConfigManager.instance.config.userInactivityConfirmation;

  const onActivity = useDebouncedCallback(() => {
    if (!isIdle) {
      setIdleSince(Date.now());
    }
  }, 500);

  const logout = useCallback(() => {
    LogManager.instance.log([{
      topic: 'USER_LOGOUT_BY_INACTIVITY',
      level: LogLevel.TRACE,
      detail: auth.user,
    }]);
    LogManager.instance.flushLog();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    auth.signoutRedirect();
  }, [auth]);

  useEffect(() => {
    /**
     * Note: this uses an interval instead of a timeout because timeouts can be paused when the browser tab is inactive.
     */
    idleIntervalRef.current = setInterval(() => {
      if (idleSince > 0 && Date.now() - ALLOWED_IDLE_TIME_MS > idleSince) {
        setIdleDiff(Date.now() - idleSince);
        setIsIdle(true);

        const notificationEndTime = idleSince + ALLOWED_IDLE_TIME_MS + NOTIFICATION_TIME_MS;
        setNotificationDiff(notificationEndTime - Date.now());
      }
    }, 500);
    return () => {
      clearInterval(idleIntervalRef.current);
    };
  }, [ALLOWED_IDLE_TIME_MS, NOTIFICATION_TIME_MS, idleSince]);

  useEffect(() => {
    if (notificationDiff < 0) {
      logout();
    }
  }, [logout, notificationDiff]);

  useEffect(() => {
    if (isIdle) {
      confirmation.current?.open();
    } else {
      confirmation.current?.close();
    }
  }, [isIdle]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll'];
    events.forEach((event) => window.addEventListener(event, onActivity));

    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, [onActivity]);

  const getReadableTimeRemaining = useCallback((milliseconds: number) => {
    return TimeUtil.getReadableTimeRemaining(milliseconds, t);
  }, [t]);

  const onClose = useCallback(() => {
    setIsIdle(false);
    setIdleSince(Date.now());
    setIdleDiff(0);
  }, []);

  const onCancel = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <Confirmation
      ref={confirmation}
      body={t('Because you were inactive for the last {{formattedTimeInactive}}, you will be automatically logged out in {{formattedTimeUntilLogout}}.', {
        formattedTimeInactive: getReadableTimeRemaining(idleDiff),
        formattedTimeUntilLogout: getReadableTimeRemaining(notificationDiff),
      })}
      cancelLabel={'Logout'}
      confirmLabel={t`Stay logged in`}
      maxWidth={'xs'}
      title={t`Your session is about to expire`}
      onCancel={onCancel}
      onClose={onClose}
      onConfirm={onClose}
    />
  );
};
