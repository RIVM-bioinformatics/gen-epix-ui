import {
  Box,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import ChatIcon from '@mui/icons-material/Chat';

import { UserSettingsManager } from '../../../classes/managers/UserSettingsManager';
import {
  UserFeedbackDialog,
  type UserFeedbackDialogRefMethods,
} from '../UserFeedbackDialog';
import { ConfigManager } from '../../../classes/managers/ConfigManager';

const NOW = new Date().getTime();

export const ApplicationBarActionsFeedbackItem = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const userFeedbackDialogRef = useRef<UserFeedbackDialogRefMethods>(null);
  const [isFeedbackTooltipOpen, setIsFeedbackTooltipOpen] = useState(false);
  useEffect(() => {
    if (!UserSettingsManager.instance.showShowUserFeedbackTooltip) {
      return;
    }
    const timeoutMs = Math.max(0, ConfigManager.instance.config.userFeedback.SHOW_USER_FEEDBACK_TOOLTIP_AFTER_MS - (new Date().getTime() - NOW));
    const handle = setTimeout(() => {
      setIsFeedbackTooltipOpen(true);
    }, timeoutMs);
    return () => {
      clearTimeout(handle);
    };
  }, []);

  const onUserFeedbackMenuIconClick = useCallback(() => {
    userFeedbackDialogRef.current.open();
  }, []);

  const onTooltipMouseEnter = useCallback(() => {
    setIsFeedbackTooltipOpen(false);
    UserSettingsManager.instance.showShowUserFeedbackTooltip = false;
  }, []);

  return (
    <>
      <Tooltip
        arrow
        color={'secondary'}
        onMouseEnter={onTooltipMouseEnter}
        open={isFeedbackTooltipOpen}
        placement={'left'}
        slotProps={{
          arrow: {
            sx: {
              color: theme.palette.secondary.main,
            },
          },
          popper: {
            disablePortal: true,
          },
          tooltip: {
            sx: {
              backgroundColor: theme.palette.secondary.main,
              marginRight: `${theme.spacing(0.5)} !important`,
            },
          },
        }}
        title={t`Would you like to share your feedback?`}
      >
        <IconButton
          aria-label={t`Feedback`}
          color={'inherit'}
          onClick={onUserFeedbackMenuIconClick}
        >
          <ChatIcon color={'inherit'} />
          <Box
            sx={{
              fontSize: '1.3rem',
              marginLeft: theme.spacing(1),
              [theme.breakpoints.up('md')]: {
                position: 'absolute',
                visibility: 'hidden',
              },
            }}
          >
            {t`Feedback`}
          </Box>
        </IconButton>
      </Tooltip>
      <UserFeedbackDialog ref={userFeedbackDialogRef} />
    </>
  );
};
