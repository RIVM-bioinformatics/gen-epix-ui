import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Children,
  useMemo,
} from 'react';
import type {
  PropsWithChildren,
  ReactElement,
} from 'react';

import { ApplicationFooterLink } from './ApplicationFooterLink';

export type ApplicationFooterLinkSectionProps = PropsWithChildren<{
  readonly header: string;
}>;

export type ApplicationFooterLinkSectionTheme = {
  color: string;
  sectionBorder: string;
};

export const ApplicationFooterLinkSection = ({ children, header }: ApplicationFooterLinkSectionProps) => {
  const theme = useTheme();
  const applicationFooterLinkSectionTheme = useMemo<ApplicationFooterLinkSectionTheme>(() => ({
    ...{
      color: theme.palette.primary.contrastText,
      sectionBorder: `1px solid ${theme.palette.primary.contrastText}`,
    } satisfies ApplicationFooterLinkSectionTheme,
    ...(theme.components?.GenEpixUiClientCommonApplicationFooterLinkSection ?? {}),
  }), [theme]);

  // eslint-disable-next-line @eslint-react/no-children-for-each
  Children.forEach(children, (child) => {
    if ((child as ReactElement)?.type !== ApplicationFooterLink) {
      throw Error('ApplicationFooterLinkSection only accepts ApplicationFooterLink as children');
    }
  });

  return (
    <Box
      sx={{ padding: 2 }}
    >
      <Typography
        component={'h2'}
        sx={{
          borderBottom: applicationFooterLinkSectionTheme.sectionBorder,
          color: applicationFooterLinkSectionTheme.color,
          fontWeight: 500,
          marginBottom: theme.spacing(1),
          paddingBottom: theme.spacing(1),
        }}
        variant={'h4'}
      >
        {header}
      </Typography>
      <Box
        component={'ul'}
        sx={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
