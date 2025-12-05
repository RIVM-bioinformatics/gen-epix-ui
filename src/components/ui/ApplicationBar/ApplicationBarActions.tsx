import {
  Alert,
  AlertTitle,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';

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
  const navId = useId();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuButtonClick = useCallback(() => {
    setIsMenuOpen(x => !x);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMenuOpen]);

  return (
    <Box
      {...TestIdUtil.createAttributes('ApplicationBarActions')}
      sx={{
        display: 'flex',
        alignItems: 'center',
        paddingRight: 1,
      }}
    >
      <IconButton
        aria-label={t`Toggle footer menu`}
        aria-controls={navId}
        sx={{
          color: theme.palette.primary.contrastText,
          [theme.breakpoints.up('md')]: {
            display: 'none',
          },
        }}
        onClick={onMenuButtonClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Box
        sx={{
          display: 'flex',
          [theme.breakpoints.down('md')]: {
            display: isMenuOpen ? 'flex' : 'none',
            position: 'absolute',
            alignItems: 'start',
            flexDirection: 'column',
            background: theme.palette.secondary.main,
            top: theme.spacing(6),
            right: 0,
            left: 0,
            zIndex: theme.zIndex.appBar - 1,
          },
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
              paddingLeft: 1,
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
    </Box>
  );
};
