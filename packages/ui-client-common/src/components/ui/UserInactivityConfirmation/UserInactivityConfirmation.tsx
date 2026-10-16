import { container } from 'tsyringe';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { ConfirmationRefMethods } from '@gen-epix/ui-core-components/components/Confirmation';
import { Confirmation } from '@gen-epix/ui-core-components/components/Confirmation';

import type { InactivityState } from '../../../classes/services/InactivityService';
import { InactivityService } from '../../../classes/services/InactivityService';

export const UserInactivityConfirmation = () => {
  const { t } = useTranslation();
  const confirmationRef = useRef<ConfirmationRefMethods>(null);
  const [idleState, setIdleState] = useState<InactivityState>(container.resolve(InactivityService).data);


  useEffect(() => {
    const unsubscribe = container.resolve(InactivityService).subscribe((data) => {
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
    container.resolve(InactivityService).logout();
  }, []);

  const onClose = useCallback(() => {
    container.resolve(InactivityService).reset();
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
