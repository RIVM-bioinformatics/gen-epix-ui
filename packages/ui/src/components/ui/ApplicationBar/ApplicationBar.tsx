import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { ApplicationBarNavigationMenu } from './ApplicationBarNavigationMenu';
import { ApplicationBarActions } from './ApplicationBarActions';

export type ApplicationBarProps = {
  readonly fullHeight?: boolean;
  readonly fullWidth?: boolean;
  readonly singleAction?: boolean;
};

export const ApplicationBar = ({
  fullWidth,
  singleAction,
}: ApplicationBarProps) => {
  const theme = useTheme();

  return (
    <AppBar
      {...TestIdUtil.createAttributes('ApplicationBar')}
      position={'static'}
      square
      sx={{
        background: theme['gen-epix-ui'].navbar.background,
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
                  color: theme['gen-epix-ui'].navbar.primaryColor,
                  fontSize: '1.3rem',
                }}
                variant={'body2'}
              >
                {ConfigManager.getInstance().config.applicationName}
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
