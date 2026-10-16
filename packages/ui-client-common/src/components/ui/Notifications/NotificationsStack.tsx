import { container } from 'tsyringe';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import {
  Box,
  Snackbar,
} from '@mui/material';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useSubscribable } from '@gen-epix/ui-core/hooks/useSubscribable';

import { NotificationService } from '../../../classes/services/NotificationService';

import { NotificationItem } from './NotificationItem';

export const NotificationsStack = (): ReactElement => {
  const visibleNotifications = useSubscribable(container.resolve(NotificationService), {
    select: (notifications) => notifications.filter(notification => notification.visible),
  });

  const onNotificationItemClose = useCallback((key: string) => {
    container.resolve(NotificationService).hideNotification(key);
  }, []);

  return (
    <>
      {visibleNotifications.length > 0 && (
        <Snackbar
          {...TestIdUtil.createAttributes('NotificationsStack')}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          open
        >
          <Box>
            {visibleNotifications.map(notification => (
              <NotificationItem
                allowClose
                key={notification.key}
                notification={notification}
                onClose={onNotificationItemClose}
              />
            ))}
          </Box>
        </Snackbar>
      )}
    </>
  );
};
