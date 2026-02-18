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
import { useTranslation } from 'react-i18next';

import { ApplicationFooterLink } from './ApplicationFooterLink';

export type ApplicationFooterLinkSectionProps = PropsWithChildren<{
  readonly header: string;
}>;

export const ApplicationFooterLinkSection = ({ header, children }: ApplicationFooterLinkSectionProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

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
        component={'h2'}
        sx={{
          color: theme['gen-epix'].footer.color,
          borderBottom: `1px solid ${theme['gen-epix'].footer.sectionBorderColor}`,
          marginBottom: theme.spacing(1),
          paddingBottom: theme.spacing(1),
          fontWeight: 500,
        }}
        variant={'h4'}
      >
        {t(header)}
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
