import {
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
import { ApplicationBarActionsOutagesItem } from './ApplicationBarActionsOutagesItem';
import { ApplicationBarActionsUserItem } from './ApplicationBarActionsUserItem';
import { ApplicationBarActionsOrganizationSwitcherItem } from './ApplicationBarActionsOrganizationSwitcherItem';

export type ApplicationBarActionsProps = {
  readonly fullWidth?: boolean;
};

export const ApplicationBarActions = ({ fullWidth }: ApplicationBarActionsProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const environmentMessage = ConfigManager.getInstance().config.getEnvironmentMessage(t);
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
        alignItems: 'center',
        display: 'flex',
        paddingRight: 1,
      }}
    >
      <IconButton
        aria-controls={navId}
        aria-label={t`Toggle menu`}
        onClick={onMenuButtonClick}
        sx={{
          color: theme['gen-epix-ui'].navbar.primaryColor,
          [theme.breakpoints.up('md')]: {
            display: 'none',
          },
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Box
        id={navId}
        sx={{
          display: 'flex',
          [theme.breakpoints.down('md')]: {
            alignItems: 'start',
            background: theme['gen-epix-ui'].navbar.background,
            display: isMenuOpen ? 'flex' : 'none',
            flexDirection: 'column',
            left: 0,
            position: 'absolute',
            right: 0,
            top: theme.spacing(6),
            zIndex: theme.zIndex.appBar - 1,
          },
        }}
      >
        <ApplicationBarActionsFeedbackItem />
        <ApplicationBarActionsOutagesItem />
        <ApplicationBarActionsNotificationsItem />
        <ApplicationBarActionsInfoItem />
        <ApplicationBarActionsOrganizationSwitcherItem />
        <ApplicationBarActionsUserItem />
        {environmentMessage && (
          <Box
            {...TestIdUtil.createAttributes('ApplicationBarActions-EnvironmentMessage')}
            aria-hidden={'true'}
            sx={{
              alignItems: 'center',
              color: theme['gen-epix-ui'].navbar.environmentMessageColor,
              display: 'flex',
              fontWeight: 700,
              marginRight: fullWidth ? 0 : 1,
              padding: `0 ${theme.spacing(1)} !important`,
              textTransform: 'uppercase',
              [theme.breakpoints.down('md')]: {
                position: 'absolute',
                visibility: 'hidden',
              },
            }}
          >
            {t('{{environmentMessage}}', { environmentMessage })}
          </Box>
        )}
      </Box>
    </Box>
  );
};
