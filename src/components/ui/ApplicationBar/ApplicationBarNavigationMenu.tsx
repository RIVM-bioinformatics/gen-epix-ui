import {
  Box,
  styled,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { NavLink as BaseNavLink } from 'react-router-dom';
import { useMemo } from 'react';

import { routes } from '../../../data/routes';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';

const NavLink = styled(BaseNavLink)(({ theme }) => ({
  color: theme.palette.secondary.contrastText,
  display: 'inline-block',
  textDecoration: 'none',
  fontSize: '1.3rem',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const NavLinkDisabled = styled(Box)(({ theme }) => ({
  color: theme.palette.secondary.light,
  display: 'inline-block',
  fontSize: '1.3rem',
}));

export type ApplicationBarNavigationMenuProps = {
  readonly fullWidth?: boolean;
};

export const ApplicationBarNavigationMenu = ({ fullWidth }: ApplicationBarNavigationMenuProps) => {
  const [t] = useTranslation();
  const theme = useTheme();
  const authorizationManager = useMemo(() => AuthorizationManager.instance, []);

  const menuItems = useMemo(() => {
    const rootItem = routes.find(r => r.handle.root);
    return [rootItem, ...rootItem.children.filter(r => !r.handle.hidden)] as MyNonIndexRouteObject[];
  }, []);

  return (
    <Box
      component={'nav'}
      sx={{ flexGrow: 1 }}
    >
      <Box
        component={'ul'}
        sx={{
          padding: 0,
          margin: 0,
          display: 'flex',
          marginLeft: fullWidth ? 0 : 2,
        }}
      >
        {menuItems.map(menuItem => {
          const disabled = menuItem.handle.disabled || !authorizationManager.doesUserHavePermissionForRoute(menuItem);
          return (
            <Box
              component={'li'}
              key={menuItem.path}
              sx={{
                display: 'flex',
                alignItems: 'center',
                listStyle: 'none',
                padding: `0 ${theme.spacing(2)}`,
                height: 48,
                '&:has(.active)': {
                  background: theme.palette.primary.main,
                  a: {
                    color: theme.palette.primary.contrastText,
                  },
                },
                '& svg': {
                  marginTop: '6px',
                },
              }}
            >
              {!disabled && (
                <NavLink
                  aria-label={t(menuItem.handle.titleKey)}
                  to={menuItem.path}
                >
                  {!!menuItem.handle.icon && menuItem.handle.icon}
                  {!menuItem.handle.icon && t(menuItem.handle.titleKey)}
                </NavLink>
              )}
              {disabled && (
                <NavLinkDisabled
                  aria-disabled
                >
                  {!!menuItem.handle.icon && menuItem.handle.icon}
                  {!menuItem.handle.icon && t(menuItem.handle.titleKey)}
                </NavLinkDisabled>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
