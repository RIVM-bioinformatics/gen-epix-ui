import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';
import { addMonths } from 'date-fns';
import {
  MenuItem,
  ListItemText,
} from '@mui/material';

import type { UserInvitation } from '../../api';
import {
  OrganizationApi,
  AuthApi,
  CommandName,
} from '../../api';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { useOrganizationAdminPolicyMap } from '../../dataHooks/useOrganizationAdminPolicies';
import { useOrganizationOptions } from '../../dataHooks/useOrganizations';
import { useRoleOptions } from '../../dataHooks/useRoles';
import { useUserOptions } from '../../dataHooks/useUsers';
import type { Loadable } from '../../models/dataHooks';
import type {
  OptionBase,
  FormFieldDefinition,
} from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type {
  TableRowParams,
  TableColumn,
} from '../../models/table';
import { StringUtil } from '../../utils/StringUtil';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageProps } from '../CrudPage';
import { CrudPage } from '../CrudPage';

import { UserInvitationsAdminDetailDialog } from './UserInvitationsAdminDetailDialog';
import type { UserInvitationsAdminDetailDialogRefMethods } from './UserInvitationsAdminDetailDialog';

type FormFields = Pick<UserInvitation, 'email' | 'organization_id' | 'roles'>;

export const UserInvitationsAdminPage = () => {
  const [t] = useTranslation();
  const baseOrganizationOptions = useOrganizationOptions();
  const roleOptions = useRoleOptions();
  const userOptions = useUserOptions();
  const organizationAdminPolicyMap = useOrganizationAdminPolicyMap();

  const organizationOptions = useMemo<OptionBase<string>[]>(() => {
    if (baseOrganizationOptions.isLoading || baseOrganizationOptions.error) {
      return [];
    }
    const allowedOrganizationIds = Array.from(organizationAdminPolicyMap.map.values()).filter((policy) => policy.is_active && policy.user_id === AuthorizationManager.instance.user.id).map((policy) => policy.organization_id);
    return baseOrganizationOptions.options.filter((option) => allowedOrganizationIds.includes(option.value));
  }, [baseOrganizationOptions.error, baseOrganizationOptions.isLoading, baseOrganizationOptions.options, organizationAdminPolicyMap.map]);

  const loadables = useMemo<Loadable[]>(() => [baseOrganizationOptions, roleOptions, userOptions, organizationAdminPolicyMap], [organizationAdminPolicyMap, baseOrganizationOptions, roleOptions, userOptions]);

  const userInvitationsAdminDetailDialogRef = useRef<UserInvitationsAdminDetailDialogRefMethods>(null);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.getInstance().userInvitationsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: UserInvitation) => {
    return await OrganizationApi.getInstance().userInvitationsDeleteOne(item.id);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AuthApi.getInstance().userInvitationsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.email;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      email: string().email().required().max(100),
      organization_id: string().uuid4().required().max(100),
      roles: array().min(1).required(),
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onCreateSuccess = useCallback(async (item: UserInvitation) => {
    userInvitationsAdminDetailDialogRef.current.open({ item });
  }, []);

  const customOnRowClick = useCallback((params: TableRowParams<UserInvitation>) => {
    userInvitationsAdminDetailDialogRef.current.open({ item: params.row });
  }, []);

  /**
   * Hidden form field values that are not visible to the user. These are set by the backend. It's a shortcoming of the openapi generator that it doesn't support mandatory read-only fields.
   */
  const hiddenFormFieldValues = useMemo<CrudPageProps<FormFields, UserInvitation>['hiddenFormFieldValues']>(() => {
    return {
      token: StringUtil.createUuid(),
      invited_by_user_id: StringUtil.createUuid(),
      expires_at: addMonths(new Date(), 2).toISOString(),
    };
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    const fields: FormFieldDefinition<FormFields>[] = [];

    fields.push(
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'email',
        label: t`Email`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'organization_id',
        label: t`Organization`,
        options: organizationOptions,
        loading: baseOrganizationOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        multiple: true,
        name: 'roles',
        label: t`Roles`,
        options: roleOptions.options,
        loading: roleOptions.isLoading,
      },
    );
    return fields;
  }, [t, organizationOptions, baseOrganizationOptions.isLoading, roleOptions.options, roleOptions.isLoading]);

  const extraActionsFactory = useCallback((params: TableRowParams<UserInvitation>) => {
    return [(
      <MenuItem
        key={'custom-action-1'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => userInvitationsAdminDetailDialogRef.current.open({ item: params.row })}
      >
        <ListItemText>
          {t`Send invitation`}
        </ListItemText>
      </MenuItem>
    )];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<UserInvitation>[] => {
    return [
      TableUtil.createTextColumn<UserInvitation>({ id: 'email', name: t`Email` }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'organization_id', name: t`Organization`, options: organizationOptions }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'invited_by_user_id', name: t`Invited by user`, options: userOptions.options }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'roles', name: t`Roles`, options: roleOptions.options }),
      TableUtil.createDateColumn<UserInvitation>({ id: 'expires_at', name: t`Expires` }),
    ];
  }, [t, organizationOptions, userOptions.options, roleOptions.options]);

  return (
    <>
      <CrudPage<FormFields, UserInvitation>
        createItemButtonText={t`Invite user`}
        createOne={createOne}
        crudCommandType={CommandName.UserInvitationCrudCommand}
        customOnRowClick={customOnRowClick}
        defaultSortByField={'email'}
        defaultSortDirection={'asc'}
        deleteOne={deleteOne}
        extraActionsFactory={extraActionsFactory}
        fetchAll={fetchAll}
        formFieldDefinitions={formFieldDefinitions}
        getName={getName}
        hiddenFormFieldValues={hiddenFormFieldValues}
        loadables={loadables}
        onCreateSuccess={onCreateSuccess}
        resourceQueryKeyBase={QUERY_KEY.USER_REGISTRATIONS}
        schema={schema}
        tableColumns={tableColumns}
        testIdAttributes={TestIdUtil.createAttributes('UserInvitationsAdminPage')}
        title={t`User invitations`}
      />
      <UserInvitationsAdminDetailDialog ref={userInvitationsAdminDetailDialogRef} />
    </>
  );
};
