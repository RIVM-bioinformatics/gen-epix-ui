import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyIcon from '@mui/icons-material/Key';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';

import {
  Confirmation,
  type ConfirmationRefMethods,
} from '../Confirmation';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { StringUtil } from '../../../utils/StringUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { MyPermissionsDialogRefMethods } from '../MyPermissionsDialog';
import { MyPermissionsDialog } from '../MyPermissionsDialog';
import { DataUtil } from '../../../utils/DataUtil';

import { UserOrganizationAdminMenuItem } from './UserOrganizationAdminMenuItem';
import { UserOwnOrganizationMenuItem } from './UserOwnOrganizationMenuItem';

type UserMenuProps = {
  readonly anchorElement: HTMLElement;
  readonly onClose: () => void;
};

export const UserMenu = ({ anchorElement, onClose }: UserMenuProps): ReactElement => {
  const auth = useAuth();
  const logoutConfirmationRef = useRef<ConfirmationRefMethods>(null);
  const popoverId = useMemo(() => StringUtil.createUuid(), []);
  const isUserMenuOpen = !!anchorElement;
  const { t } = useTranslation();

  const myPermissionsDialogRef = useRef<MyPermissionsDialogRefMethods>(null);

  const onViewMyPermissionsButtonClick = useCallback(() => {
    myPermissionsDialogRef.current.open();
  }, []);

  const onLogoutButtonClick = useCallback(() => {
    logoutConfirmationRef.current.open();
  }, []);

  const onLogoutConfirmationConfirm = useCallback(() => {
    LogManager.getInstance().log([{
      detail: auth.user,
      level: CommonDbLogLevel.TRACE,
      topic: 'USER_LOGOUT',
    }]);
    LogManager.getInstance().flushLog();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    auth.signoutRedirect();
  }, [auth]);

  const userName = useMemo(() => {
    return DataUtil.getUserDisplayValue(AuthorizationManager.getInstance().user, t);
  }, [t]);

  const userRoles = useMemo(() => {
    return AuthorizationManager.getInstance().user?.roles;
  }, []);

  return (
    <Popover
      {...TestIdUtil.createAttributes('UserMenu')}
      anchorEl={anchorElement}
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'bottom',
      }}
      id={isUserMenuOpen ? popoverId : undefined}
      onClose={onClose}
      open={isUserMenuOpen}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
    >
      <List
        sx={{
          maxWidth: 300,
          minWidth: 200,
          width: '100%',
        }}
      >
        <ListItem
          divider
        >
          <ListItemText
            primary={userName ?? t`Unknown`}
            slotProps={{
              primary: {
                sx: {
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </ListItem>
        <UserOwnOrganizationMenuItem />
        <UserOrganizationAdminMenuItem />
        <ListItem
          divider
          sx={{
            paddingTop: 0,
          }}
        >
          <ListItemText
            primary={t`My roles`}
            secondary={(
              <>
                {userRoles?.map((role) => (
                  <Box
                    component={'span'}
                    key={role}
                    sx={{
                      display: 'inline-block',
                      marginRight: 1,
                    }}
                  >
                    {role}
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
          alignItems={'center'}
          divider
          sx={{ justifyContent: 'center' }}
        >
          <ListItemButton
            onClick={onViewMyPermissionsButtonClick}
          >
            <ListItemIcon>
              <KeyIcon color={'primary'} />
            </ListItemIcon>
            <ListItemText
              primary={t`My API permissions`}
              slotProps={{
                primary: {
                  sx: {
                    color: 'primary.main',
                  },
                },
              }}
            />
          </ListItemButton>
          <MyPermissionsDialog
            ref={myPermissionsDialogRef}
          />
        </ListItem>
        <ListItem
          alignItems={'center'}
          sx={{ justifyContent: 'center' }}
        >
          <ListItemButton
            onClick={onLogoutButtonClick}
          >
            <ListItemIcon>
              <LogoutIcon color={'secondary'} />
            </ListItemIcon>
            <ListItemText
              primary={t`Logout`}
              slotProps={{
                primary: {
                  sx: {
                    color: 'secondary.main',
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
            ref={logoutConfirmationRef}
            title={t`Are you sure you want to logout?`}
          />
        </ListItem>
      </List>
    </Popover>
  );
};
