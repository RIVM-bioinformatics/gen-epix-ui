import {
  Alert,
  AlertTitle,
  Box,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { ApplicationBarActionsFeedbackItem } from './ApplicationBarActionsFeedbackItem';
import { ApplicationBarActionsInfoItem } from './ApplicationBarActionsInfotem';
import { ApplicationBarActionsNotificationsItem } from './ApplicationBarActionsNotificationsItem';
import { ApplicationBarActionsOrganizationSwitcherItem } from './ApplicationBarActionsOrganizationItem';
import { ApplicationBarActionsOutagesItem } from './ApplicationBarActionsOutagesItem';
import { ApplicationBarActionsUserItem } from './ApplicationBarActionsUserItem';

export type ApplicationBarActionsProps = {
  readonly fullWidth?: boolean;
};

export const ApplicationBarActions = ({ fullWidth }: ApplicationBarActionsProps) => {
  const theme = useTheme();
  const [t] = useTranslation();
  const environmentMessage = ConfigManager.instance.config.getEnvironmentMessage(t);

  return (
    <Box
      {...TestIdUtil.createAttributes('ApplicationBarActions')}
      sx={{
        display: 'flex',
        alignItems: 'center',
        paddingRight: 1,
      }}
    >
      <ApplicationBarActionsFeedbackItem />
      <ApplicationBarActionsOutagesItem />
      <ApplicationBarActionsOrganizationSwitcherItem />
      <ApplicationBarActionsNotificationsItem />
      <ApplicationBarActionsInfoItem />
      <ApplicationBarActionsUserItem />
      {environmentMessage && (
        <Alert
          {...TestIdUtil.createAttributes('ApplicationBarActions-EnvironmentMessage')}
          severity={'warning'}
          sx={{
            marginLeft: 1,
            background: theme.palette.background.paper,
            padding: `0 ${theme.spacing(1)} !important`,
            marginRight: fullWidth ? 0 : 1,
            [theme.breakpoints.down('md')]: {
              visibility: 'hidden',
              position: 'absolute',
            },
          }}
        >
          <AlertTitle>
            {t('{{environmentMessage}} ', { environmentMessage })}
          </AlertTitle>
        </Alert>
      )}
    </Box>
  );
};
