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
import {
  MenuItem,
  ListItemText,
} from '@mui/material';

import type { UserInvitation } from '../../api';
import {
  OrganizationApi,
  CommandName,
} from '../../api';
import { useOrganizationAdminPolicyMapQuery } from '../../dataHooks/useOrganizationAdminPoliciesQuery';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import { useUserOptionsQuery } from '../../dataHooks/useUsersQuery';
import { useArray } from '../../hooks/useArray';
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
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { useInviteUserConstraintsQuery } from '../../dataHooks/useInviteUserConstraintsQuery';

import { UserInvitationsAdminDetailDialog } from './UserInvitationsAdminDetailDialog';
import type { UserInvitationsAdminDetailDialogRefMethods } from './UserInvitationsAdminDetailDialog';

type FormFields = Pick<UserInvitation, 'key' | 'organization_id' | 'roles'>;

export const UserInvitationsAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const inviteUserConstraintsQuery = useInviteUserConstraintsQuery();
  const userOptionsQuery = useUserOptionsQuery();
  const organizationAdminPolicyMapQuery = useOrganizationAdminPolicyMapQuery();

  const organizationOptions = useMemo<OptionBase<string>[]>(() => {
    if (!organizationOptionsQuery?.options?.length || !inviteUserConstraintsQuery?.data) {
      return [];
    }
    return organizationOptionsQuery.options.filter(option => inviteUserConstraintsQuery.data.organization_ids.includes(option.value));

  }, [organizationOptionsQuery.options, inviteUserConstraintsQuery.data]);

  const roleOptions = useMemo<OptionBase<string>[]>(() => {
    if (!inviteUserConstraintsQuery?.data) {
      return [];
    }
    return inviteUserConstraintsQuery.data.roles.map(role => ({
      value: role,
      label: `ROLE_${role}`,
    }));
  }, [inviteUserConstraintsQuery.data]);

  const loadables = useArray([inviteUserConstraintsQuery, organizationOptionsQuery, userOptionsQuery, organizationAdminPolicyMapQuery]);

  const userInvitationsAdminDetailDialogRef = useRef<UserInvitationsAdminDetailDialogRefMethods>(null);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.instance.userInvitationsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: UserInvitation) => {
    return await OrganizationApi.instance.userInvitationsDeleteOne(item.id);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.instance.inviteUser({
      ...variables,
    })).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.key;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      key: string().email().required().max(100),
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


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    const fields: FormFieldDefinition<FormFields>[] = [];

    fields.push(
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'key',
        label: t`Email`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'organization_id',
        label: t`Organization`,
        options: organizationOptions,
        loading: organizationOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        multiple: true,
        name: 'roles',
        label: t`Roles`,
        options: roleOptions,
        loading: inviteUserConstraintsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    );
    return fields;
  }, [t, organizationOptions, organizationOptionsQuery.isLoading, roleOptions, inviteUserConstraintsQuery.isLoading]);

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
      TableUtil.createTextColumn<UserInvitation>({ id: 'key', name: t`Email` }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'organization_id', name: t`Organization`, options: organizationOptions }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'invited_by_user_id', name: t`Invited by user`, options: userOptionsQuery.options }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'roles', name: t`Roles`, options: roleOptions }),
      TableUtil.createDateColumn<UserInvitation>({ id: 'expires_at', name: t`Expires` }),
    ];
  }, [t, organizationOptions, userOptionsQuery.options, roleOptions]);

  return (
    <>
      <CrudPage<FormFields, UserInvitation>
        createItemDialogTitle={t`Create new user invitation`}
        createItemButtonText={t`Invite user`}
        createOne={createOne}
        crudCommandType={CommandName.UserInvitationCrudCommand}
        customOnRowClick={customOnRowClick}
        defaultSortByField={'key'}
        defaultSortDirection={'asc'}
        deleteOne={deleteOne}
        extraActionsFactory={extraActionsFactory}
        fetchAll={fetchAll}
        formFieldDefinitions={formFieldDefinitions}
        getName={getName}
        loadables={loadables}
        resourceQueryKeyBase={QUERY_KEY.USER_REGISTRATIONS}
        schema={schema}
        tableColumns={tableColumns}
        testIdAttributes={TestIdUtil.createAttributes('UserInvitationsAdminPage')}
        title={t`User invitations`}
        onCreateSuccess={onCreateSuccess}
      />
      <UserInvitationsAdminDetailDialog ref={userInvitationsAdminDetailDialogRef} />
    </>
  );
};
