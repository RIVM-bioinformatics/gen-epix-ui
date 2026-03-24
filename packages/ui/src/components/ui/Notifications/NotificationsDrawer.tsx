import {
  Drawer,
  Box,
  useTheme,
  Typography,
  IconButton,
  Button,
  Divider,
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
      open={open}
      onClose={onDrawerClose}
    >
      <Box
        sx={{
          padding: theme.spacing(2),
          width: '520px',
          [theme.breakpoints.up('xl')]: {
            width: '620px',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            />
          </IconButton>
        </Box>
        {notifications.length === 0 && (
          <Box>
            <Box
              marginBottom={2}
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <NotificationsIcon
                sx={{
                  fontSize: 100,
                  color: theme.palette.text.disabled,
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
                color={'primary'}
                variant={'outlined'}
                aria-label={t`Clear all notifications`}
                onClick={onClearAllButtonClick}
              >
                {t`Clear all notifications`}
              </Button>
            </Box>
            <Box
              marginBottom={2}
              marginTop={2}
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
                  overflowY: 'auto',
                  maxHeight: '100%',
                }}
              >
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.key}
                    showTimestamp
                    allowClose={!notification.isLoading}
                    notification={notification}
                    onClose={onNotificationItemClose}
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
