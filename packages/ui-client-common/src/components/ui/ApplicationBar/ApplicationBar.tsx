import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useMemo } from 'react';

import { useConfig } from '../../../hooks/useConfig';

import { ApplicationBarNavigationMenu } from './ApplicationBarNavigationMenu';
import { ApplicationBarActions } from './ApplicationBarActions';

export type ApplicationBarProps = {
  readonly fullHeight?: boolean;
  readonly fullWidth?: boolean;
  readonly singleAction?: boolean;
};

export type ApplicationBarTheme = {
  background: string;
  primaryColor: string;
};

export const ApplicationBar = ({
  fullWidth,
  singleAction,
}: ApplicationBarProps) => {
  const theme = useTheme();
  const applicationBarTheme = useMemo<ApplicationBarTheme>(() => ({
    ...{
      background: theme.palette.primary.main,
      primaryColor: theme.palette.primary.contrastText,
    } satisfies ApplicationBarTheme,
    ...(theme.components?.GenEpixUiClientCommonApplicationBar ?? {}),
  }), [theme]);
  const config = useConfig();

  return (
    <AppBar
      {...TestIdUtil.createAttributes('ApplicationBar')}
      position={'static'}
      square
      sx={{
        background: applicationBarTheme.background,
        boxShadow: 'none',
      }}
    >
      <Container
        disableGutters
        maxWidth={fullWidth ? false : 'xl'}
      >
        <Toolbar
          disableGutters
          sx={{
            height: 48,
            justifyContent: singleAction ? 'center' : 'space-between',
            minHeight: '48px !important',
          }}
        >
          {singleAction && (
            <Box
              sx={{
                marginX: 2,
              }}
            >
              <Typography
                component={'h1'}
                sx={{
                  color: applicationBarTheme.primaryColor,
                  fontSize: '1.3rem',
                }}
                variant={'body2'}
              >
                {config.applicationName}
              </Typography>
            </Box>
          )}
          {!singleAction && (
            <>
              <ApplicationBarNavigationMenu fullWidth={fullWidth} />
              <ApplicationBarActions fullWidth={fullWidth} />
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};
