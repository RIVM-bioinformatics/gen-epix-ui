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
  readonly fullWidth?: boolean;
  readonly fullHeight?: boolean;
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
      square
      position={'static'}
      sx={{
        boxShadow: 'none',
        background: theme['gen-epix'].navbar.background,
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
            justifyContent: singleAction ? 'center' : 'space-between',
          }}
        >
          {singleAction && (
            <Box marginX={theme.spacing(2)}>
              <Typography
                component={'h1'}
                sx={{
                  color: theme['gen-epix'].navbar.primaryColor,
                  fontSize: '1.3rem',
                }}
                variant={'body2'}
              >
                {ConfigManager.instance.config.applicationName}
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
