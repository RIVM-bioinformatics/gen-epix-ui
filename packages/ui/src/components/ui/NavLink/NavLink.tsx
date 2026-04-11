import { styled } from '@mui/material';
import type { ReactNode } from 'react';
import type { NavLinkProps as ReactRouterDomNavLinkProps } from 'react-router-dom';
import {
  NavLink as ReactRouterDomNavLink,
  resolvePath,
  useMatch,
} from 'react-router-dom';

export interface NavLinkProps extends ReactRouterDomNavLinkProps {
  readonly activeAsText?: boolean;
  readonly children: ReactNode;
}

const StyledNavLink = styled(ReactRouterDomNavLink)(({ theme }) => ({
  '&:hover': {
    textDecoration: 'underline',
  },
  '&.active': {
    color: theme.palette.secondary.main,
  },
  color: theme.palette.primary.main,
  textDecoration: 'none',
}));

export const NavLink = ({ activeAsText, children, ...props }: NavLinkProps) => {
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
