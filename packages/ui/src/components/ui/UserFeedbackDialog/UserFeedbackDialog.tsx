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
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { FormFieldDefinition } from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { SchemaUtil } from '../../../utils/SchemaUtil';

export interface UserFeedbackDialogOpenProps {
  //
}

export interface UserFeedbackDialogProps extends WithDialogRenderProps<UserFeedbackDialogOpenProps> {
  //
}

export type UserFeedbackDialogRefMethods = WithDialogRefMethods<UserFeedbackDialogProps, UserFeedbackDialogOpenProps>;

type FormFields = {
  email: string;
  message: string;
  name: string;
};

export const UserFeedbackDialog = withDialog<UserFeedbackDialogProps, UserFeedbackDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
  }: UserFeedbackDialogProps,
): ReactElement => {
  const { t } = useTranslation();

  const schema = useMemo(() => object<FormFields>().shape({
    email: string().email().required().max(200),
    message: string().freeFormText().required().max(5000),
    name: SchemaUtil.name,
  }), []);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as Resolver<FormFields>,
    values: {
      email: AuthorizationManager.instance.user?.email ?? AuthorizationManager.instance.user?.key ?? '',
      message: '',
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
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Email`,
        name: 'email',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Your message`,
        multiline: true,
        name: 'message',
        rows: 15,
      } as const satisfies FormFieldDefinition<FormFields>,
  ] as const, [t]);

  useEffect(() => {
    onTitleChange(t`Feedback`);
  }, [onTitleChange, t]);

  const onFormSubmit = useCallback((formValues: FormFields): void => {
    const navigationHistory = NavigationHistoryManager.instance.navigationHistory;
    LogManager.instance.log([{
      detail: {
        ...formValues,
        navigationHistory: navigationHistory.slice(navigationHistory.length - 50).reverse(),
      },
      level: 'INFO',
      topic: 'USER_FEEDBACK',
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
          autoFocus: true,
          color: 'primary',
          label: t`Cancel`,
          onClick: onClose,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('UserFeedbackDialog-send'),
          autoFocus: true,
          color: 'secondary',
          label: t`Send`,
          onClick: handleSubmit(onFormSubmit),
          variant: 'contained',
        },
      ],
    );
  }, [handleSubmit, onActionsChange, onClose, onFormSubmit, t]);

  return (
    <Box>
      <Box
        sx={{
          marginBottom: 2,
        }}
      >
        <Typography component={'p'}>
          {t('Please help make {{applicationName}} better by sharing your feedback with us. You may use this form as many times as you like.', { applicationName: ConfigManager.instance.config.applicationName })}
        </Typography>
      </Box>
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formMethods={formMethods}
        onSubmit={handleSubmit(onFormSubmit)}
        schema={schema}
      />
    </Box>
  );
}, {
  defaultTitle: '',
  disableBackdropClick: false,
  fullWidth: true,
  maxWidth: 'md',
  noCloseButton: false,
  testId: 'UserFeedbackDialog',
});
