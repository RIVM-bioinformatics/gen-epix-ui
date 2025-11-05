import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { ApplicationBarNavigationMenu } from './ApplicationBarNavigationMenu';
import { ApplicationBarActions } from './ApplicationBarActions';

export type ApplicationBarProps = {
  readonly fullWidth?: boolean;
  readonly fullHeight?: boolean;
  readonly singleAction?: boolean;
  readonly smallLogo: ReactElement;
};

export const ApplicationBar = ({
  fullWidth,
  fullHeight,
  singleAction,
  smallLogo,
}: ApplicationBarProps) => {
  const theme = useTheme();

  return (
    <AppBar
      {...TestIdUtil.createAttributes('ApplicationBar')}
      square
      position={'static'}
      sx={{
        boxShadow: 'none',
        background: theme.palette.secondary.main,
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
            minHeight: '48px !important',
            justifyContent: singleAction ? 'center' : undefined,
          }}
        >
          {singleAction && (
            <Box marginX={theme.spacing(2)}>
              <Typography
                component={'h1'}
                sx={{
                  color: theme.palette.secondary.contrastText,
                  fontSize: '1.3rem',
                }}
                variant={'body2'}
              >
                {ConfigManager.instance.config.applicationName}
              </Typography>
            </Box>
          )}
          {fullHeight && (
            <Box
              marginX={1}
              sx={{
                height: '48px',
                '& svg': {
                  height: '100%',
                  width: 'auto',
                },
              }}
            >
              { smallLogo }
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
