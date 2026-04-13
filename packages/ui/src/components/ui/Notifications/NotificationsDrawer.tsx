import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { useSubscribable } from '../../../hooks/useSubscribable';

import { NotificationItem } from './NotificationItem';

export type NotificationsDrawerProps = {
  readonly onDrawerClose: () => void;
  readonly open: boolean;
};

export const NotificationsDrawer = ({ onDrawerClose, open }: NotificationsDrawerProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const notifications = useSubscribable(NotificationManager.instance);

  const onNotificationItemClose = useCallback((key: string) => {
    NotificationManager.instance.clearNotification(key);
  }, []);

  const onClearAllButtonClick = useCallback(() => {
    NotificationManager.instance.clearNotifications();
    onDrawerClose();
  }, [onDrawerClose]);

  return (
    <Drawer
      anchor={'right'}
      onClose={onDrawerClose}
      open={open}
    >
      <Box
        sx={{
          padding: theme.spacing(2),
          [theme.breakpoints.up('xl')]: {
            width: '620px',
          },
          width: '520px',
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 2,
          }}
        >
          <Typography
            component={'h6'}
            variant={'h3'}
          >
            {t`Notifications`}
          </Typography>
          <IconButton
            aria-label={t`Close notifications drawer`}
            onClick={onDrawerClose}
          >
            <CloseIcon
              sx={{
                '&:hover': {
                  color: theme.palette.text.primary,
                },
                color: theme.palette.text.secondary,
              }}
            />
          </IconButton>
        </Box>
        {notifications.length === 0 && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 2,
              }}
            >
              <NotificationsIcon
                sx={{
                  color: theme.palette.text.disabled,
                  fontSize: 100,
                }}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Typography>
                {t`No new notifications in this session`}
              </Typography>
            </Box>
          </Box>
        )}
        {notifications.length > 0 && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                aria-label={t`Clear all notifications`}
                color={'primary'}
                onClick={onClearAllButtonClick}
                variant={'outlined'}
              >
                {t`Clear all notifications`}
              </Button>
            </Box>
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Divider />
            </Box>
            <Box
              sx={{
                overflowY: 'hidden',
              }}
            >
              <Box
                sx={{
                  maxHeight: '100%',
                  overflowY: 'auto',
                }}
              >
                {notifications.map(notification => (
                  <NotificationItem
                    allowClose={!notification.isLoading}
                    key={notification.key}
                    notification={notification}
                    onClose={onNotificationItemClose}
                    showTimestamp
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
