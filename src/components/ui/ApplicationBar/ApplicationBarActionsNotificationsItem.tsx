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
import { Fragment } from 'react/jsx-runtime';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';

import { NotificationsDrawer } from '../Notifications';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { useSubscribable } from '../../../hooks/useSubscribable';


export const ApplicationBarActionsNotificationsItem = () => {
  const [t] = useTranslation();
  const theme = useTheme();
  const notifications = useSubscribable(NotificationManager.instance);
  const isLoading = useMemo(() => notifications.some(x => x.isLoading), [notifications]);
  const [open, setOpen] = useState(false);


  const onMenuIconClick = useCallback(() => {
    NotificationManager.instance.hideAllNotifications();
    setOpen(true);
  }, []);

  const onDrawerClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Fragment>
      <IconButton
        aria-label={t`Notifications`}
        color={'inherit'}
        title={t`Notifications`}
        onClick={onMenuIconClick}
      >
        <Badge
          badgeContent={notifications.length}
          color={'secondary'}
          sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 15, minWidth: 15, border: '1px solid white' } }}
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
              visibility: 'hidden',
              position: 'absolute',
            },
          }}
        >
          {t`Notifications`}
        </Box>
      </IconButton>
      <NotificationsDrawer
        open={open}
        onDrawerClose={onDrawerClose}
      />
    </Fragment>
  );
};
