import type { BoxProps } from '@mui/material';
import {
  Box,
  Link,
  useTheme,
} from '@mui/material';
import type { PropsWithChildren } from 'react';

export type ApplicationFooterLinkProps = PropsWithChildren<{
  readonly href?: string;
  readonly onClick?: () => void;
}> & BoxProps<'li'>;

export const ApplicationFooterLink = ({ href, onClick, children, ...boxProps }: ApplicationFooterLinkProps) => {
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
            color: theme.palette.primary.contrastText,
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
            color: theme.palette.primary.contrastText,
          }}
        >
          {children}
        </Link>
      )}
    </Box>
  );
};
