import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Typography,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import {
  object,
  string,
} from 'yup';

import { ResponseHandler } from '../ResponseHandler';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useOrganizationOptionsQuery } from '../../../dataHooks/useOrganizationsQuery';
import { useArray } from '../../../hooks/useArray';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { Autocomplete } from '../../form/fields/Autocomplete';
import { ApiManager } from '../../../classes/managers/ApiManager';

export interface OrganizationSwitcherDialogOpenProps {
  //
}

export interface OrganizationSwitcherDialogProps extends WithDialogRenderProps<OrganizationSwitcherDialogOpenProps> {
  //
}

export type OrganizationSwitcherDialogRefMethods = WithDialogRefMethods<OrganizationSwitcherDialogProps, OrganizationSwitcherDialogOpenProps>;

type FormFields = {
  organization_id?: string;
};

export const OrganizationSwitcherDialog = withDialog<OrganizationSwitcherDialogProps, OrganizationSwitcherDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
  }: OrganizationSwitcherDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const user = AuthorizationManager.getInstance().user;
  const [isChanging, setIsChanging] = useState(false);
  const [newOrganizationId, setNewOrganizationId] = useState<string>(null);

  const loadables = useArray([organizationOptionsQuery]);

  const schema = useMemo(() => {
    return object().shape({
      organization_id: string().uuid4().required(),
    });
  }, []);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as Resolver<FormFields>,
    values: {
      organization_id: user.organization_id,
    },
  });
  const { handleSubmit } = formMethods;

  const onRefreshPageClick = useCallback(() => {
    WindowManager.getInstance().window.location.reload();
  }, []);

  const onFormSubmit = useCallback((formValues: FormFields): void => {
    if (formValues.organization_id === user.organization_id) {
      onClose();
    }
    const perform = async () => {
      const notificationKey = NotificationManager.getInstance().showNotification({
        isLoading: true,
        message: t`Changing organization...`,
        severity: 'info',
      });
      try {
        setIsChanging(true);
        await ApiManager.getInstance().organizationApi.updateUserOwnOrganization({
          organization_id: formValues.organization_id,
        }, {});
        setNewOrganizationId(formValues.organization_id);
        setIsChanging(false);
        NotificationManager.getInstance().fulfillNotification(notificationKey, t`Successfully changed organization.`, 'success');
      } catch (_error: unknown) {
        NotificationManager.getInstance().fulfillNotification(notificationKey, t`Could not change organization.`, 'error');
        onClose();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [onClose, t, user.organization_id]);

  useEffect(() => {
    onTitleChange(t`Switch organization`);
  }, [onTitleChange, t]);

  useEffect(() => {
    if (isChanging) {
      onActionsChange([]);
      return;
    }

    if (newOrganizationId) {
      onActionsChange([
        {
          ...TestIdUtil.createAttributes('OrganizationSwitcherDialog-refresh'),
          autoFocus: true,
          color: 'primary',
          label: t`Refresh page`,
          onClick: onRefreshPageClick,
          variant: 'outlined',
        },
      ]);
      return;
    }

    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('OrganizationSwitcherDialog-close'),
          autoFocus: true,
          color: 'primary',
          disabled: isChanging,
          label: t`Cancel`,
          onClick: onClose,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('OrganizationSwitcherDialog-submit'),
          autoFocus: true,
          color: 'secondary',
          disabled: isChanging,
          label: t`Change`,
          onClick: handleSubmit(onFormSubmit),
          variant: 'contained',
        },
      ],
    );
  }, [handleSubmit, newOrganizationId, isChanging, onActionsChange, onClose, onFormSubmit, onRefreshPageClick, t]);

  return (
    <ResponseHandler
      isLoading={isChanging}
      loadables={loadables}
    >
      {newOrganizationId && (
        <Alert severity={'success'}>
          {t('Your organization has been changed. You are now a member of "{{organization}}". You will need to refresh the page for changes to take effect.', {
            organization: organizationOptionsQuery.options.find((option) => option.value === newOrganizationId)?.label,
          })}
        </Alert>
      )}
      {!newOrganizationId && (
        <FormProvider {...formMethods}>
          <form
            autoComplete={'off'}
            onSubmit={handleSubmit(onFormSubmit)}
          >
            <Box
              sx={{
                marginBottom: 2,
              }}
            >
              <Typography component={'p'}>
                {t`For demo purposes, it is possible to switch your organization. Choose your organization from the list below and click 'Change'.`}
              </Typography>
            </Box>
            <Box>
              <Autocomplete
                label={t`Organization`}
                name={'organization_id'}
                options={organizationOptionsQuery.options}
              />
            </Box>
          </form>
        </FormProvider>
      )}
    </ResponseHandler>
  );
}, {
  defaultTitle: '',
  disableBackdropClick: true,
  fullWidth: true,
  maxWidth: 'md',
  noCloseButton: true,
  testId: 'OrganizationSwitcherDialog',
});
