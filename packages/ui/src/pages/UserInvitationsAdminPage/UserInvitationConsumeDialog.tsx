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
import {
  CaseDbOrganizationApi,
  type CaseDbUserInvitation,
} from '@gen-epix/api-casedb';

import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { GenericForm } from '../../components/form/helpers/GenericForm';
import { AuthenticationManager } from '../../classes/managers/AuthenticationManager';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { QueryUtil } from '../../utils/QueryUtil';
import { QUERY_KEY } from '../../models/query';
import { NotificationManager } from '../../classes/managers/NotificationManager';

export interface UserInvitationConsumeDialogOpenProps {
  item: CaseDbUserInvitation;
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
      AuthenticationManager.instance.temporaryToken = data.bearerToken;
      await CaseDbOrganizationApi.instance.userRegistrationsPostOne(openProps.item.token);
      NotificationManager.instance.showNotification({
        message: t`Invitation has been consumed by bearer token`,
        severity: 'success',
      });
      onClose();
    } catch (responseError) {
      setError(responseError);
    } finally {
      delete AuthenticationManager.instance.temporaryToken;
      const queryKeys = QueryUtil.getQueryKeyDependencies([QUERY_KEY.USER_INVITATIONS], true);
      await QueryUtil.invalidateQueryKeys(queryKeys);
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
