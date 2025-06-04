import { IconButton } from '@mui/material';
import { Fragment } from 'react/jsx-runtime';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {
  useCallback,
  useState,
} from 'react';
import type { MouseEvent } from 'react';

import { UserMenu } from './UserMenu';

export const ApplicationBarActionsUserItem = () => {
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
        onClick={onAccountMenuIconClick}
        title={'Account'}
      >
        <AccountCircleIcon color={'inherit'} />
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
