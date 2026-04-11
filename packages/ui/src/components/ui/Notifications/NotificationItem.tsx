import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import { TestIdUtil } from '../../../utils/TestIdUtil';
import { TimeUtil } from '../../../utils/TimeUtil';
import type { Notification } from '../../../models/notification';

export type NotificationItemProps = {
  readonly allowClose: boolean;
  readonly notification: Notification;
  readonly onClose: (key: string) => void;
  readonly showTimestamp?: boolean;
};

export const NotificationItem = ({ allowClose, notification, onClose, showTimestamp }: NotificationItemProps) => {
  const { t } = useTranslation();

  const onCloseButtonClick = useCallback(() => {
    onClose(notification.key);
  }, [notification.key, onClose]);

  const now = useMemo(() => new Date().getTime(), []);

  return (
    <Alert
      {...TestIdUtil.createAttributes('NotificationItem', { key: notification.key })}
      closeText={t`Clear notification`}
      icon={notification.isLoading ? <CircularProgress size={16} /> : undefined}
      onClose={allowClose ? onCloseButtonClick : undefined}
      severity={notification.isLoading ? 'info' : notification.severity}
      slotProps={{
        message: {
          sx: {
            flexGrow: 1,
          },
        },
      }}
      sx={{
        backgroundColor: 'background.paper',
        boxShadow: 1,
        marginBottom: 1,
      }}
    >
      <AlertTitle
        sx={{
          width: '100%',
        }}
      >
        {notification.message}
      </AlertTitle>
      {showTimestamp && (
        <Box
          sx={{
            textAlign: 'right',
          }}
        >
          {TimeUtil.getReadableTimeRemaining(now - notification.timestamp, true)}
          {' '}
          {t('ago')}
        </Box>
      )}
    </Alert>
  );
};
