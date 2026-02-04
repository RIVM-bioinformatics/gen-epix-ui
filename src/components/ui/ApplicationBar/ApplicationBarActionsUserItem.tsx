import {
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import { Fragment } from 'react/jsx-runtime';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {
  useCallback,
  useState,
} from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { UserMenu } from './UserMenu';

export const ApplicationBarActionsUserItem = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [accountMenuAnchorElement, setAccountMenuAnchorElement] = useState<null | HTMLElement>(null);

  const onAccountMenuIconClick = useCallback((event: MouseEvent<HTMLElement>): void => {
    setAccountMenuAnchorElement(event.currentTarget);
  }, []);

  const onAccountMenuClose = useCallback(() => {
    setAccountMenuAnchorElement(null);
  }, []);

  return (
    <Fragment>
      <IconButton
        color={'inherit'}
        title={'Account'}
        onClick={onAccountMenuIconClick}
      >
        <AccountCircleIcon color={'inherit'} />
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
          {t`Account`}
        </Box>
      </IconButton>
      {accountMenuAnchorElement && (
        <UserMenu
          anchorElement={accountMenuAnchorElement}
          onClose={onAccountMenuClose}
        />
      )}

    </Fragment>
  );
};
