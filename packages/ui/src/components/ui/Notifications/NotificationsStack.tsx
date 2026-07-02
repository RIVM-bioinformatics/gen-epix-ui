import type { ReactElement } from 'react';
import { useCallback } from 'react';
import {
  Box,
  Snackbar,
} from '@mui/material';

import { NotificationService } from '../../../classes/services/NotificationService';
import { useSubscribable } from '../../../hooks/useSubscribable';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { NotificationItem } from './NotificationItem';

export const NotificationsStack = (): ReactElement => {
  const visibleNotifications = useSubscribable(NotificationService.getInstance(), {
    select: (notifications) => notifications.filter(notification => notification.visible),
  });

  const onNotificationItemClose = useCallback((key: string) => {
    NotificationService.getInstance().hideNotification(key);
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
