import {
  Box,
  IconButton,
  styled,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import { NavLink as BaseNavLink } from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { RouterManager } from '../../../classes/managers/RouterManager';

const NavLink = styled(BaseNavLink)(({ theme }) => ({
  '&:hover': {
    textDecoration: 'underline',
  },
  color: theme.palette.secondary.contrastText,
  display: 'inline-block',
  fontSize: '1.3rem',
  textDecoration: 'none',
}));

export type ApplicationBarNavigationMenuProps = {
  readonly fullWidth?: boolean;
};

export const ApplicationBarNavigationMenu = ({ fullWidth }: ApplicationBarNavigationMenuProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const authorizationManager = useMemo(() => AuthorizationManager.instance, []);
  const navId = useId();

  const menuItems = useMemo(() => {
    const rootItem = RouterManager.instance.routes.find(r => r.handle.root);
    return [rootItem, ...rootItem.children.filter(r => !r.handle.hidden)] as MyNonIndexRouteObject[];
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMenuOpen]);

  const onMenuButtonClick = useCallback(() => {
    setIsMenuOpen(x => !x);
  }, []);

  return (
    <Box
      sx={{
        flexGrow: 1,
      }}
    >
      <IconButton
        aria-controls={navId}
        aria-label={t`Toggle navigation menu`}
        onClick={onMenuButtonClick}
        sx={{
          color: theme['gen-epix'].navbar.primaryColor,
          [theme.breakpoints.up('md')]: {
            display: 'none',
          },
        }}
      >
        <MenuIcon />
      </IconButton>
      <Box
        component={'nav'}
        id={navId}
        sx={{
          flexGrow: 1,
          [theme.breakpoints.down('md')]: {
            background: theme['gen-epix'].navbar.background,
            display: isMenuOpen ? 'block' : 'none',
            left: 0,
            paddingBottom: 4,
            position: 'absolute',
            top: 48,
            width: '100%',
          },
        }}
      >
        <Box
          component={'ul'}
          sx={{
            display: 'flex',
            margin: 0,
            marginLeft: fullWidth ? 0 : 2,
            padding: 0,
            [theme.breakpoints.down('md')]: {
              display: 'block',
              margin: 0,
            },
          }}
        >
          {menuItems.filter(menuItem => !menuItem.handle.disabled && authorizationManager.doesUserHavePermissionForRoute(menuItem)).map(menuItem => {
            return (
              <Box
                component={'li'}
                key={menuItem.path}
                sx={{
                  '&:has(.active)': {
                    '& svg': {
                      color: theme['gen-epix'].navbar.activeColor,
                    },
                    a: {
                      color: theme['gen-epix'].navbar.activeColor,
                    },
                    background: theme['gen-epix'].navbar.activeBackground,
                  },
                  '& svg': {
                    marginTop: '6px',
                  },
                  alignItems: 'center',
                  color: theme['gen-epix'].navbar.primaryColor,
                  display: 'flex',
                  fontWeight: 800,
                  height: 48,
                  listStyle: 'none',
                  padding: `0 ${theme.spacing(1)}`,
                }}
              >
                <NavLink
                  aria-label={menuItem.handle.title}
                  sx={{
                    padding: `0 ${theme.spacing(1)}`,
                  }}
                  to={menuItem.path}
                >
                  {!!menuItem.handle.icon && menuItem.handle.icon}
                  {!menuItem.handle.icon && menuItem.handle.title}
                </NavLink>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
