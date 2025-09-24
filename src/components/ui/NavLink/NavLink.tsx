import { styled } from '@mui/material';
import type { ReactNode } from 'react';
import type { NavLinkProps as ReactRouterDomNavLinkProps } from 'react-router-dom';
import {
  NavLink as ReactRouterDomNavLink,
  resolvePath,
  useMatch,
} from 'react-router-dom';

export interface NavLinkProps extends ReactRouterDomNavLinkProps {
  readonly children: ReactNode;
  readonly activeAsText?: boolean;
}

const StyledNavLink = styled(ReactRouterDomNavLink)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
  '&.active': {
    color: theme.palette.secondary.main,
  },
}));

export const NavLink = ({ children, activeAsText, ...props }: NavLinkProps) => {
  const match = useMatch({
    path: resolvePath(props.to).pathname,
  });

  if (activeAsText && match) {
    return (
      <>
        {children}
      </>
    );
  }
  return (
    <StyledNavLink {...props}>
      {({ isActive }) => (
        <span className={isActive ? 'active' : ''}>
          {children}
        </span>
      )}
    </StyledNavLink>
  );
};
