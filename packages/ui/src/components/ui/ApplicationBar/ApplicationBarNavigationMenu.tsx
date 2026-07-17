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
import type { MouseEvent } from 'react';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { RouterService } from '../../../classes/services/RouterService';

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
  const authorizationService = useMemo(() => AuthorizationService.getInstance(), []);
  const navId = useId();

  const menuItems = useMemo(() => {
    const rootItem = RouterService.getInstance().routes.find(r => r.handle.root);
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

  const onNavLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.currentTarget.ariaDisabled === 'true') {
      event.preventDefault();
    }
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
          color: theme['gen-epix-ui'].navbar.primaryColor,
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
            background: theme['gen-epix-ui'].navbar.background,
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
          {menuItems.filter(menuItem => authorizationService.doesUserHavePermissionForRoute(menuItem)).map(menuItem => {
            const isDisabled = !!menuItem.handle.disabled;
            return (
              <Box
                component={'li'}
                key={menuItem.path}
                sx={{
                  '&:has(.active:not([aria-disabled="true"]))': {
                    '& svg': {
                      color: theme['gen-epix-ui'].navbar.activeColor,
                    },
                    a: {
                      color: theme['gen-epix-ui'].navbar.activeColor,
                    },
                    background: theme['gen-epix-ui'].navbar.activeBackground,
                  },
                  '& svg': {
                    color: isDisabled ? theme.palette.grey[400] : undefined,
                    marginTop: '6px',
                  },
                  alignItems: 'center',
                  color: isDisabled ? theme.palette.grey[400] : theme['gen-epix-ui'].navbar.primaryColor,
                  display: 'flex',
                  fontWeight: 800,
                  height: 48,
                  listStyle: 'none',
                  padding: `0 ${theme.spacing(1)}`,
                }}
              >
                <NavLink
                  aria-disabled={isDisabled || undefined}
                  aria-label={menuItem.handle.title}
                  onClick={onNavLinkClick}
                  sx={{
                    '&:hover': {
                      textDecoration: isDisabled ? 'none' : undefined,
                    },
                    color: isDisabled ? theme.palette.grey[400] : undefined,
                    cursor: isDisabled ? 'not-allowed' : undefined,
                    padding: `0 ${theme.spacing(1)}`,
                  }}
                  tabIndex={isDisabled ? -1 : undefined}
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
