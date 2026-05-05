import {
  Badge,
  Box,
  CircularProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';

import { NotificationsDrawer } from '../Notifications';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { useSubscribable } from '../../../hooks/useSubscribable';


export const ApplicationBarActionsNotificationsItem = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const notifications = useSubscribable(NotificationManager.getInstance());
  const isLoading = useMemo(() => notifications.some(x => x.isLoading), [notifications]);
  const [open, setOpen] = useState(false);


  const onMenuIconClick = useCallback(() => {
    NotificationManager.getInstance().hideAllNotifications();
    setOpen(true);
  }, []);

  const onDrawerClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <IconButton
        aria-label={t`Notifications`}
        color={'inherit'}
        onClick={onMenuIconClick}
        title={t`Notifications`}
      >
        <Badge
          badgeContent={notifications.length}
          color={'secondary'}
          sx={{ '& .MuiBadge-badge': { border: '1px solid white', fontSize: 9, height: 15, minWidth: 15 } }}
        >
          <NotificationsIcon color={'inherit'} />
        </Badge>
        {isLoading && (
          <CircularProgress
            color={'inherit'}
            size={theme.spacing(3.5)}
            sx={{
              position: 'absolute',
            }}
          />
        )}
        <Box
          sx={{
            fontSize: '1.3rem',
            marginLeft: theme.spacing(1),
            [theme.breakpoints.up('md')]: {
              position: 'absolute',
              visibility: 'hidden',
            },
          }}
        >
          {t`Notifications`}
        </Box>
      </IconButton>
      <NotificationsDrawer
        onDrawerClose={onDrawerClose}
        open={open}
      />
    </>
  );
};
