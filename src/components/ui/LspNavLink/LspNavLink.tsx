import { styled } from '@mui/material';
import type { ReactNode } from 'react';
import type { NavLinkProps } from 'react-router-dom';
import {
  NavLink,
  resolvePath,
  useMatch,
} from 'react-router-dom';

export interface LspNavLinkProps extends NavLinkProps {
  readonly children: ReactNode;
  readonly activeAsText?: boolean;
}

const StyledNavLink = styled(NavLink)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
  '&.active': {
    color: theme.palette.secondary.main,
  },
}));

export const LspNavLink = ({ children, activeAsText, ...props }: LspNavLinkProps) => {
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
        <span className={isActive ? 'active' : ''}>{children}</span>
      )}
    </StyledNavLink>
  );
};
