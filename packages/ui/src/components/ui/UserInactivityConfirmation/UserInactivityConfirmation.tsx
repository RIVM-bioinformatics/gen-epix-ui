import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { ConfirmationRefMethods } from '../Confirmation';
import { Confirmation } from '../Confirmation';
import type { InactivityState } from '../../../classes/managers/InactivityManager';
import { InactivityManager } from '../../../classes/managers/InactivityManager';

export const UserInactivityConfirmation = () => {
  const { t } = useTranslation();
  const confirmationRef = useRef<ConfirmationRefMethods>(null);
  const [idleState, setIdleState] = useState<InactivityState>(InactivityManager.instance.data);


  useEffect(() => {
    const unsubscribe = InactivityManager.instance.subscribe((data) => {
      if (data.isIdle) {
        setIdleState(data);
        confirmationRef.current?.open();
      } else {
        confirmationRef.current?.close();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const onCancel = useCallback(() => {
    InactivityManager.instance.logout();
  }, []);

  const onClose = useCallback(() => {
    InactivityManager.instance.reset();
  }, []);


  return (
    <Confirmation
      body={t('Because you were inactive for the last {{formattedTimeInactive}}, you will be automatically logged out in {{formattedTimeUntilLogout}}.', {
        formattedTimeInactive: idleState.readableIdleDiff,
        formattedTimeUntilLogout: idleState.readableNotificationDiff,
      })}
      cancelLabel={'Logout'}
      confirmLabel={t`Stay logged in`}
      maxWidth={'xs'}
      onCancel={onCancel}
      onClose={onClose}
      onConfirm={onClose}
      ref={confirmationRef}
      title={t`Your session is about to expire`}
    />
  );
};
