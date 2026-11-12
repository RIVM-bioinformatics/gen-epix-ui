import type { BoxProps } from '@mui/material';
import {
  Box,
  Link,
  useTheme,
} from '@mui/material';
import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';

export type ApplicationFooterLinkProps = BoxProps<'li'> & PropsWithChildren<{
  readonly href?: string;
  readonly onClick?: () => void;
}>;

export type ApplicationFooterLinkTheme = {
  color: string;
};

export const ApplicationFooterLink = ({ children, href, onClick, ...boxProps }: ApplicationFooterLinkProps) => {
  const theme = useTheme();
  const applicationFooterLinkTheme = useMemo<ApplicationFooterLinkTheme>(() => ({
    ...{
      color: theme.palette.primary.contrastText,
    } satisfies ApplicationFooterLinkTheme,
    ...(theme.components?.GenEpixUiClientCommonApplicationFooterLink ?? {}),
  }), [theme]);

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
            color: applicationFooterLinkTheme.color,
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
            color: applicationFooterLinkTheme.color,
          }}
        >
          {children}
        </Link>
      )}
    </Box>
  );
};
