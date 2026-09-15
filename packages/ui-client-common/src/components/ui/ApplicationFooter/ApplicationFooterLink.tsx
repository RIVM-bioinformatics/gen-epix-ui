import type { BoxProps } from '@mui/material';
import {
  Box,
  Link,
  useTheme,
} from '@mui/material';
import type { PropsWithChildren } from 'react';

export type ApplicationFooterLinkProps = BoxProps<'li'> & PropsWithChildren<{
  readonly href?: string;
  readonly onClick?: () => void;
}>;

export const ApplicationFooterLink = ({ children, href, onClick, ...boxProps }: ApplicationFooterLinkProps) => {
  const theme = useTheme();

  return (
    <Box
      component={'li'}
      {...boxProps}
    >
      {href && (
        <Link
          href={href}
          onClick={onClick}
          rel={'noreferrer'}
          sx={{
            color: theme['gen-epix-ui'].footer.color,
          }}
          target={'_blank'}
        >
          {children}
        </Link>
      )}
      {!href && (
        <Link
          component={'button'}
          onClick={onClick}
          sx={{
            color: theme['gen-epix-ui'].footer.color,
          }}
        >
          {children}
        </Link>
      )}
    </Box>
  );
};
