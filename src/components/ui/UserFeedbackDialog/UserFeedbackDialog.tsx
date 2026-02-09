import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  object,
  string,
} from 'yup';
import {
  Box,
  Typography,
} from '@mui/material';

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
import type { FormFieldDefinition } from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';

export interface UserFeedbackDialogOpenProps {
  //
}

export interface UserFeedbackDialogProps extends WithDialogRenderProps<UserFeedbackDialogOpenProps> {
  //
}

export type UserFeedbackDialogRefMethods = WithDialogRefMethods<UserFeedbackDialogProps, UserFeedbackDialogOpenProps>;

type FormFields = {
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
  const { t } = useTranslation();

  const schema = useMemo(() => object<FormFields>().shape({
    message: string().freeFormText().required().max(5000),
    email: string().email().required().max(200),
    name: string().extendedAlpha().required().max(200),
  }), []);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as Resolver<FormFields>,
    values: {
      message: '',
      email: AuthorizationManager.instance.user?.email ?? AuthorizationManager.instance.user?.key ?? '',
      name: AuthorizationManager.instance.user?.name ?? '',
    },
  });
  const { handleSubmit } = formMethods;

  useEffect(() => {
    UserSettingsManager.instance.showShowUserFeedbackTooltip = false;
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'email',
        label: t`Email`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'message',
        label: t`Your message`,
        multiline: true,
        rows: 15,
      } as const satisfies FormFieldDefinition<FormFields>,
  ] as const, [t]);

  useEffect(() => {
    onTitleChange(t`Feedback`);
  }, [onTitleChange, t]);

  const onFormSubmit = useCallback((formValues: FormFields): void => {
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
          label: t`Cancel`,
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
    <Box>
      <Box marginBottom={2}>
        <Typography component={'p'}>
          {t('Please help make {{applicationName}} better by sharing your feedback with us. You may use this form as many times as you like.', { applicationName: ConfigManager.instance.config.applicationName })}
        </Typography>
      </Box>
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formMethods={formMethods}
        schema={schema}
        onSubmit={handleSubmit(onFormSubmit)}
      />
    </Box>
  );
}, {
  testId: 'UserFeedbackDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
