import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Popover,
  List,
  ListItem,
  Box,
  ListItemText,
  ListItemButton,
  ListItemIcon,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';

import {
  Confirmation,
  type ConfirmationRefMethods,
} from '../Confirmation';
import { LogLevel } from '../../../api';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { DataUtil } from '../../../utils/DataUtil';
import { StringUtil } from '../../../utils/StringUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { UserOrganizationAdminMenuItem } from './UserOrganizationAdminMenuItem';

type UserMenuProps = {
  readonly onClose: () => void;
  readonly anchorElement: HTMLElement;
};

export const UserMenu = ({ anchorElement, onClose }: UserMenuProps): ReactElement => {
  const auth = useAuth();
  const logoutConfirmation = useRef<ConfirmationRefMethods>(null);
  const popoverId = useMemo(() => StringUtil.createUuid(), []);
  const isUserMenuOpen = !!anchorElement;
  const [t] = useTranslation();

  const onLogoutButtonClick = useCallback(() => {
    logoutConfirmation.current.open();
  }, []);

  const onLogoutConfirmationConfirm = useCallback(() => {
    LogManager.instance.log([{
      topic: 'USER_LOGOUT',
      level: LogLevel.TRACE,
      detail: auth.user,
    }]);
    LogManager.instance.flushLog();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    auth.signoutRedirect();
  }, [auth]);

  const userName = useMemo(() => {
    return DataUtil.getUserDisplayValue(AuthorizationManager.instance.user, t);
  }, [t]);

  const userRoles = useMemo(() => {
    return AuthorizationManager.instance.user?.roles;
  }, []);

  const userOrganization = useMemo(() => {
    return AuthorizationManager.instance.user?.organization?.name;
  }, []);

  return (
    <Popover
      {...TestIdUtil.createAttributes('UserMenu')}
      anchorEl={anchorElement}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={isUserMenuOpen ? popoverId : undefined}
      onClose={onClose}
      open={isUserMenuOpen}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <List
        sx={{
          width: '100%',
          minWidth: 200,
          maxWidth: 300,
        }}
      >
        <ListItem
          sx={{
            paddingBottom: 0,
          }}
        >
          <ListItemText
            primary={t`Logged in user`}
            secondary={userName ?? t`Unknown`}
            slotProps={{
              primary: {
                sx: {
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </ListItem>
        <ListItem
          divider
          sx={{
            paddingTop: 0,
          }}
        >
          <ListItemText
            primary={t`Your roles`}
            secondary={(
              <>
                {userRoles?.map((role) => (
                  <Box
                    component={'span'}
                    key={role}
                    mr={1}
                    sx={{ display: 'inline-block' }}
                  >
                    {t(role)}
                  </Box>
                ))}
              </>
            )}
            slotProps={{
              primary: {
                sx: {
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </ListItem>
        <ListItem
          sx={{
            paddingBottom: 0,
          }}
        >
          <ListItemText
            primary={t`Your organization`}
            secondary={userOrganization ?? t`Unknown`}
            slotProps={{
              primary: {
                sx: {
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </ListItem>

        <UserOrganizationAdminMenuItem />

        <ListItem
          alignItems={'center'}
          sx={{ justifyContent: 'center' }}
        >
          <ListItemButton
            onClick={onLogoutButtonClick}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary={t`Logout`}
              slotProps={{
                primary: {
                  sx: {
                    color: 'primary.main',
                    fontWeight: 'bold',
                  },
                },
              }}
            />
          </ListItemButton>
          <Confirmation
            body={t`Click the logout button to logout`}
            cancelLabel={t`Cancel`}
            confirmLabel={t`Logout`}
            onConfirm={onLogoutConfirmationConfirm}
            ref={logoutConfirmation}
            title={t`Are you sure you want to logout?`}
          />
        </ListItem>
      </List>
    </Popover>
  );
};
