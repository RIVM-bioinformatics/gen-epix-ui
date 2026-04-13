import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  boolean,
  object,
  string,
} from 'yup';

import type {
  ApiPermission,
  User,
} from '../../api';
import {
  CommandName,
  OrganizationApi,
  PermissionType,
} from '../../api';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import type {
  FormFieldDefinition,
  OptionBase,
} from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import type { EpiUserRightsDialogRefMethods } from '../../components/epi/EpiUserRightsDialog';
import { EpiUserRightsDialog } from '../../components/epi/EpiUserRightsDialog';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { useArray } from '../../hooks/useArray';
import { useInviteUserConstraintsQuery } from '../../dataHooks/useInviteUserConstraintsQuery';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<User, 'organization_id' | 'organization'>;

export const UsersAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const epiUserRightsDialogRef = useRef<EpiUserRightsDialogRefMethods>(null);
  const inviteUserConstraintsQuery = useInviteUserConstraintsQuery();
  const [tableRoleOptions, setTableRoleOptions] = useState<OptionBase<string>[]>([]);
  const [formRoleOptions, setFormRoleOptions] = useState<OptionBase<string>[]>([]);

  const loadables = useArray([
    organizationOptionsQuery,
    inviteUserConstraintsQuery,
  ]);

  const onRowsChange = useCallback((items: User[]) => {
    // Because roles are a string array (instead of an enum or similar), we need to dynamically determine the options for the roles column in the table and in the form.
    // The options for the form are determined by the invite user constraints endpoint, but if the user doesn't have access to that endpoint, we fall back to using the roles that are currently in use by users in the system.
    const roles = new Set<string>();
    items.forEach((user) => {
      user.roles.forEach((role) => roles.add(role));
    });
    const _tableRoleOptions = Array.from(roles).map((role) => ({
      label: role,
      value: role,
    }));
    setTableRoleOptions(_tableRoleOptions);
    let _formRoleOptions: OptionBase<string>[];
    if (AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RetrieveInviteUserConstraintsCommand, permission_type: PermissionType.EXECUTE },
    ])) {
      _formRoleOptions = inviteUserConstraintsQuery?.data ? inviteUserConstraintsQuery.data.roles.map(role => ({
        label: role,
        value: role,
      })) : _tableRoleOptions;
    } else {
      _formRoleOptions = _tableRoleOptions;
    }
    // The users own roles may not be included in the options from the invite user constraints endpoint (if they don't have permission to view that endpoint),
    // so we need to add those to the options as well, but disable them since the user doesn't have permission to assign those roles to other users.
    const extraRolesFromUser = AuthorizationManager.instance.user.roles.filter(role => !_formRoleOptions.some(option => option.value === role));
    _formRoleOptions.push(...extraRolesFromUser.map(role => ({
      disabled: true,
      label: role,
      value: role,
    })));
    setFormRoleOptions(_formRoleOptions);
  }, [inviteUserConstraintsQuery.data]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const users = (await OrganizationApi.instance.usersGetAll({ signal }))?.data;

    return users;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: User) => {
    return (await OrganizationApi.instance.updateUser(item.id, {
      is_active: variables.is_active,
      organization_id: item.organization_id,
      roles: variables.roles,
    })).data;
  }, []);

  const deleteOne = useCallback(async (item: User) => {
    return await OrganizationApi.instance.usersDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.email;
  }, []);

  const canEditItem = useCallback((item: User) => {
    return AuthorizationManager.instance.user.email !== item.email;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      description: SchemaUtil.description,
      email: string().email().nullable(),
      is_active: boolean().required(),
      key: string().optional(),
      name: string().nullable(),
      roles: array().required().min(1),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        disabled: true,
        label: t`Key`,
        name: 'key',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Email`,
        name: 'email',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Roles`,
        loading: inviteUserConstraintsQuery.isLoading,
        multiple: true,
        name: 'roles',
        options: formRoleOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Is active`,
        name: 'is_active',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t, formRoleOptions, inviteUserConstraintsQuery.isLoading]);

  const tableColumns = useMemo((): TableColumn<User>[] => {
    return [
      TableUtil.createOptionsColumn<User>({ id: 'organization_id', name: t`Organization`, options: organizationOptionsQuery.options }),
      TableUtil.createTextColumn<User>({ id: 'key', name: t`Key` }),
      TableUtil.createTextColumn<User>({ id: 'email', name: t`E-Mail` }),
      TableUtil.createTextColumn<User>({ advancedSort: true, id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<User>({ id: 'description', name: t`Description` }),
      TableUtil.createOptionsColumn<User>({ id: 'roles', name: t`Roles`, options: tableRoleOptions }),
      TableUtil.createBooleanColumn<User>({ id: 'is_active', name: t`Is active` }),
    ];
  }, [organizationOptionsQuery.options, tableRoleOptions, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: User): User => {
    return {
      email: previousItem.email,
      id: previousItem.id,
      is_active: previousItem.is_active,
      key: previousItem.email,
      name: previousItem.name,
      organization_id: previousItem.organization_id,
      ...variables,
    };
  }, []);

  const subPages = useMemo<CrudPageSubPage<User>[]>(() => {
    const doesUserHavePermissionToViewEffectiveRights = AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.ColSetMemberCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.ColSetCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.OrganizationShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.UserShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
    ]);

    if (!doesUserHavePermissionToViewEffectiveRights) {
      return [];
    }
    return [
      {
        getPathName: (item: User) => `/management/users/${item.id}/effective-rights-tester`,
        label: t`Test effective rights`,
      } satisfies CrudPageSubPage<User>,
      {
        getPathName: (item: User) => `/management/users/${item.id}/effective-rights`,
        label: t`View effective rights`,
      } satisfies CrudPageSubPage<User>,
    ];

  }, [t]);


  const extraUpdateOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.UpdateUserCommand, permission_type: PermissionType.EXECUTE },
  ], []);
  const extraDeleteOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.DELETE },
  ], []);

  return (
    <>
      <CrudPage<FormFields, User>
        canEditItem={canEditItem}
        createItemDialogTitle={t`Create new user`}
        defaultSortByField={'name'}
        defaultSortDirection={'asc'}
        deleteOne={deleteOne}
        extraDeleteOnePermissions={extraDeleteOnePermissions}
        extraUpdateOnePermissions={extraUpdateOnePermissions}
        fetchAll={fetchAll}
        formFieldDefinitions={formFieldDefinitions}
        getName={getName}
        getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
        loadables={loadables}
        onRowsChange={onRowsChange}
        resourceQueryKeyBase={QUERY_KEY.USERS}
        schema={schema}
        subPages={subPages}
        tableColumns={tableColumns}
        testIdAttributes={TestIdUtil.createAttributes('UsersAdminPage')}
        title={t`Users`}
        updateOne={updateOne}
      />
      <EpiUserRightsDialog ref={epiUserRightsDialogRef} />
    </>
  );
};
