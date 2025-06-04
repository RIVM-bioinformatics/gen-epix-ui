import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { Children } from 'react';
import type {
  PropsWithChildren,
  ReactElement,
} from 'react';

import { ApplicationFooterLink } from '../ApplicationFooterLink';

export type ApplicationFooterLinkSectionProps = PropsWithChildren<{
  readonly header: string;
}>;

export const ApplicationFooterLinkSection = ({ header, children }: ApplicationFooterLinkSectionProps) => {
  const theme = useTheme();

  Children.forEach(children, (child) => {
    if ((child as ReactElement)?.type !== ApplicationFooterLink) {
      throw Error('ApplicationFooterLinkSection only accepts ApplicationFooterLink as children');
    }
  });

  return (
    <Box
      padding={2}
    >
      <Typography
        component={'h3'}
        sx={{
          color: theme.palette.primary.contrastText,
          borderBottom: `1px solid ${theme.palette.primary.contrastText}`,
          marginBottom: theme.spacing(1),
          paddingBottom: theme.spacing(1),
          fontWeight: 'normal',
        }}
        variant={'h4'}
      >
        {header}
      </Typography>
      <Box
        component={'ul'}
        sx={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
