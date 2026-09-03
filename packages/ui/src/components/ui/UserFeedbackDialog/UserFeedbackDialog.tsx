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
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';
import { GenericForm } from '@gen-epix/ui-core-form/components/helpers/GenericForm';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui-core-components/hoc/withDialog';
import { withDialog } from '@gen-epix/ui-core-components/hoc/withDialog';

import { ConfigService } from '../../../classes/services/ConfigService';
import { LogService } from '../../../classes/services/LogService';
import { NavigationHistoryService } from '../../../classes/services/NavigationHistoryService';
import { NotificationService } from '../../../classes/services/NotificationService';
import { UserSettingsService } from '../../../classes/services/UserSettingsService';
import { AuthorizationService } from '../../../classes/services/AuthorizationService';

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
      email: AuthorizationService.getInstance().user?.email ?? AuthorizationService.getInstance().user?.key ?? '',
      message: '',
      name: AuthorizationService.getInstance().user?.name ?? '',
    },
  });
  const { handleSubmit } = formMethods;

  useEffect(() => {
    UserSettingsService.getInstance().showShowUserFeedbackTooltip = false;
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
    const navigationHistory = NavigationHistoryService.getInstance().navigationHistory;
    LogService.getInstance().log([{
      detail: {
        ...formValues,
        navigationHistory: navigationHistory.slice(navigationHistory.length - 50).reverse(),
      },
      level: 'INFO',
      topic: 'USER_FEEDBACK',
    }]);
    LogService.getInstance().flushLog();
    NotificationService.getInstance().showNotification({
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
          {t('Please help make {{applicationName}} better by sharing your feedback with us. You may use this form as many times as you like.', { applicationName: ConfigService.getInstance().config.applicationName })}
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
