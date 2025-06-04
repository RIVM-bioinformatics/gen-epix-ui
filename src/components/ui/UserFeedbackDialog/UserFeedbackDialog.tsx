import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Typography,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
} from 'react';
import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  object,
  string,
} from 'yup';
import { useAuth } from 'react-oidc-context';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { NavigationHistoryManager } from '../../../classes/managers/NavigationHistoryManager';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { UserSettingsManager } from '../../../classes/managers/UserSettingsManager';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export interface UserFeedbackDialogOpenProps {
  //
}

export interface UserFeedbackDialogProps extends WithDialogRenderProps<UserFeedbackDialogOpenProps> {
  //
}

export type UserFeedbackDialogRefMethods = WithDialogRefMethods<UserFeedbackDialogProps, UserFeedbackDialogOpenProps>;

type FormValues = {
  message: string;
  email: string;
  name: string;
};

export const UserFeedbackDialog = withDialog<UserFeedbackDialogProps, UserFeedbackDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onClose,
  }: UserFeedbackDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const auth = useAuth();

  const formMethods = useForm<FormValues>({
    resolver: yupResolver(object().shape({
      message: string().freeFormText().required().max(5000),
      email: string().email().required().max(200),
      name: string().extendedAlpha().required().max(200),
    })),
    values: {
      message: '',
      email: auth.user?.profile?.email ?? '',
      name: auth.user?.profile?.name ?? '',
    },
  });
  const { handleSubmit } = formMethods;

  useEffect(() => {
    UserSettingsManager.instance.showShowUserFeedbackTooltip = false;
  }, []);

  useEffect(() => {
    onTitleChange(t`Feedback`);
  }, [onTitleChange, t]);

  const onFormSubmit = useCallback((formValues: FormValues): void => {
    const navigationHistory = NavigationHistoryManager.instance.navigationHistory;
    LogManager.instance.log([{
      level: 'INFO',
      topic: 'USER_FEEDBACK',
      detail: {
        ...formValues,
        navigationHistory: navigationHistory.slice(navigationHistory.length - 50).reverse(),
      },
    }]);
    LogManager.instance.flushLog();
    NotificationManager.instance.showNotification({
      message: t`Thank you for sharing your feedback with us`,
      severity: 'success',
    });
    onClose();
  }, [onClose, t]);

  useEffect(() => {
    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('UserFeedbackDialog-close'),
          color: 'primary',
          autoFocus: true,
          onClick: onClose,
          variant: 'outlined',
          label: t`Discard`,
        },
        {
          ...TestIdUtil.createAttributes('UserFeedbackDialog-send'),
          color: 'secondary',
          autoFocus: true,
          onClick: handleSubmit(onFormSubmit),
          variant: 'contained',
          label: t`Send`,
        },
      ],
    );
  }, [handleSubmit, onActionsChange, onClose, onFormSubmit, t]);

  return (
    <FormProvider {...formMethods}>
      <form
        autoComplete={'off'}
        onSubmit={handleSubmit(onFormSubmit)}
      >
        <Box marginBottom={2}>
          <Typography component={'p'}>
            {t('Please help make {{applicationName}} better by sharing your feedback with us. You may use this form as many times as you like.', { applicationName: ConfigManager.instance.config.applicationName })}
          </Typography>
        </Box>
        <Box>
          <TextField
            label={t`Name`}
            name={'name'}
          />
        </Box>
        <Box>
          <TextField
            label={t`Email`}
            name={'email'}
          />
        </Box>
        <Box>
          <TextField
            label={t`Your message`}
            multiline
            name={'message'}
            rows={15}
          />
        </Box>
      </form>
    </FormProvider>
  );
}, {
  testId: 'UserFeedbackDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
