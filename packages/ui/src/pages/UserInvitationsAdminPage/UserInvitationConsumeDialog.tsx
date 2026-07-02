import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import {
  object,
  string,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { CommonDbUserInvitation } from '@gen-epix/api-commondb';

import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { GenericForm } from '../../components/form/helpers/GenericForm';
import { AuthenticationService } from '../../classes/services/AuthenticationService';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { NotificationService } from '../../classes/services/NotificationService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiService } from '../../classes/services/ApiService';

export interface UserInvitationConsumeDialogOpenProps {
  item: CommonDbUserInvitation;
}

export interface UserInvitationConsumeDialogProps extends WithDialogRenderProps<UserInvitationConsumeDialogOpenProps> {
}

export type UserInvitationConsumeDialogRefMethods = WithDialogRefMethods<UserInvitationConsumeDialogProps, UserInvitationConsumeDialogOpenProps>;

type FormFields = {
  bearerToken: string;
};

export const UserInvitationConsumeDialog = withDialog<UserInvitationConsumeDialogProps, UserInvitationConsumeDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: UserInvitationConsumeDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();
  const [error, setError] = useState<unknown>(null);

  const schema = useMemo(() => object<FormFields>().shape({
    bearerToken: string().required(),
  }), []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Bearer Token`,
        multiline: true,
        name: 'bearerToken',
        rows: 10,
      } as const satisfies FormFieldDefinition<FormFields>,
  ] as const, [t]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema, undefined, { raw: true }) as Resolver<FormFields>,
    values: {
      bearerToken: '',
    },
  });
  const { handleSubmit } = formMethods;

  const onFormSubmit = useCallback(async (data: FormFields) => {
    try {
      AuthenticationService.getInstance().temporaryToken = data.bearerToken;
      await ApiService.getInstance().organizationApi.userRegistrationsPostOne(openProps.item.token);
      NotificationService.getInstance().showNotification({
        message: t`Invitation has been consumed by bearer token`,
        severity: 'success',
      });
      onClose();
    } catch (responseError) {
      setError(responseError);
    } finally {
      delete AuthenticationService.getInstance().temporaryToken;
      const queryKeys = QueryClientService.getInstance().getQueryKeyDependencies([COMMON_QUERY_KEY.USER_INVITATIONS], true);
      await QueryClientService.getInstance().invalidateQueryKeys(queryKeys);
    }
  }, [onClose, openProps.item.token, t]);

  useEffect(() => {
    onTitleChange(t`Consume invitation with bearer token`);
  }, [onTitleChange, openProps.item.key, t]);


  useEffect(() => {
    onActionsChange([
      {
        ...TestIdUtil.createAttributes('UserInvitationConsumeDialog-agree'),
        color: 'primary',
        disabled: !!error,
        form: formId,
        label: t('Submit'),
        type: 'submit',
        variant: 'contained',
      },
    ]);
  }, [onActionsChange, t, formId, error]);

  return (
    <Box>
      <ResponseHandler
        error={error}
        shouldHideActionButtons
      >
        <GenericForm<FormFields>
          formFieldDefinitions={formFieldDefinitions}
          formId={formId}
          formMethods={formMethods}
          onSubmit={handleSubmit(onFormSubmit)}
          schema={schema}
        />
      </ResponseHandler>
    </Box>
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'md',
  testId: 'UserInvitationConsumeDialog',
});
