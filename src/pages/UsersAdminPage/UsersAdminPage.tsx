import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  boolean,
  object,
  string,
} from 'yup';
import {
  MenuItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';

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
import type {
  TableColumn,
  TableRowParams,
} from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { EpiUserRightsDialogRefMethods } from '../../components/epi/EpiUserRightsDialog';
import { EpiUserRightsDialog } from '../../components/epi/EpiUserRightsDialog';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { DialogAction } from '../../components/ui/Dialog';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { useArray } from '../../hooks/useArray';
import { useUsersQuery } from '../../dataHooks/useUsersQuery';
import { useInviteUserConstraintsQuery } from '../../dataHooks/useInviteUserConstraintsQuery';

type FormFields = Pick<User, 'email' | 'is_active' | 'roles'>;

export const UsersAdminPage = () => {
  const [t] = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const epiUserRightsDialogRef = useRef<EpiUserRightsDialogRefMethods>(null);
  const inviteUserConstraintsQuery = useInviteUserConstraintsQuery();
  const usersQuery = useUsersQuery();

  const loadables = useArray([
    organizationOptionsQuery,
    usersQuery,
    inviteUserConstraintsQuery,
  ]);

  const tableRoleOptions = useMemo<OptionBase<string>[]>(() => {
    if (!usersQuery?.data) {
      return [];
    }
    const roles = new Set<string>();
    usersQuery.data.forEach((user) => {
      user.roles.forEach((role) => roles.add(role));
    });
    return Array.from(roles).map((role) => ({
      value: role,
      label: role,
    }));
  }, [usersQuery.data]);

  const formRoleOptions = useMemo<OptionBase<string>[]>(() => {
    if (!inviteUserConstraintsQuery?.data?.roles?.length) {
      return tableRoleOptions;
    }
    return inviteUserConstraintsQuery.data.roles.map(role => ({
      value: role,
      label: role,
    }));
  }, [inviteUserConstraintsQuery.data, tableRoleOptions]);

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
      email: string().email().required(),
      roles: array().required().min(1),
      is_active: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'email',
        label: t`Email`,
        disabled: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'roles',
        label: t`Roles`,
        options: formRoleOptions,
        multiple: true,
        loading: inviteUserConstraintsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t, formRoleOptions, inviteUserConstraintsQuery.isLoading]);

  const tableColumns = useMemo((): TableColumn<User>[] => {
    return [
      TableUtil.createTextColumn<User>({ id: 'name', name: t`Name`, advancedSort: true }),
      TableUtil.createOptionsColumn<User>({ id: 'organization_id', name: t`Organization`, options: organizationOptionsQuery.options }),
      TableUtil.createTextColumn<User>({ id: 'email', name: t`E-Mail` }),
      TableUtil.createOptionsColumn<User>({ id: 'roles', name: t`Roles`, options: tableRoleOptions }),
      TableUtil.createBooleanColumn<User>({ id: 'is_active', name: t`Is active` }),
    ];
  }, [organizationOptionsQuery.options, tableRoleOptions, t]);

  const doesUserHavePermissionToViewEffectiveRights = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.CaseTypeColSetMemberCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeColSetCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.OrganizationShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.UserShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
      { command_name: CommandName.CaseTypeColCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const extraActionsFactory = useCallback((params: TableRowParams<User>) => {
    if (!doesUserHavePermissionToViewEffectiveRights) {
      return [];
    }

    return [(
      <MenuItem
        key={'custom-action-1'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={async () => await RouterManager.instance.router.navigate({
          pathname: `/management/users/${params.row.id}/effective-rights`,
        })}
      >
        <ListItemIcon>
          <PermIdentityIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t`View effective rights`}
        </ListItemText>
      </MenuItem>
    )];
  }, [doesUserHavePermissionToViewEffectiveRights, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: User): User => {
    return {
      id: previousItem.id,
      is_active: previousItem.is_active,
      organization_id: previousItem.organization_id,
      name: previousItem.name,
      key: previousItem.email,
      email: previousItem.email,
      ...variables,
    };
  }, []);


  const editDialogExtraActionsFactory = useCallback((item: User): DialogAction[] => {
    if (!doesUserHavePermissionToViewEffectiveRights) {
      return [];
    }
    return [
      {
        ...TestIdUtil.createAttributes('UsersAdminPage-ViewUserRightsButton'),
        label: t`View effective rights`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/users/${item.id}/effective-rights`,
        }),
      },
    ];
  }, [doesUserHavePermissionToViewEffectiveRights, t]);

  const extraUpdateOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.UpdateUserCommand, permission_type: PermissionType.EXECUTE },
  ], []);
  const extraDeleteOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.DELETE },
  ], []);

  return (
    <>
      <CrudPage<FormFields, User>
        loadables={loadables}
        canEditItem={canEditItem}
        extraUpdateOnePermissions={extraUpdateOnePermissions}
        extraDeleteOnePermissions={extraDeleteOnePermissions}
        createItemDialogTitle={t`Create new user`}
        defaultSortByField={'name'}
        defaultSortDirection={'asc'}
        deleteOne={deleteOne}
        editDialogExtraActionsFactory={editDialogExtraActionsFactory}
        extraActionsFactory={extraActionsFactory}
        fetchAll={fetchAll}
        formFieldDefinitions={formFieldDefinitions}
        getName={getName}
        getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
        resourceQueryKeyBase={QUERY_KEY.USERS}
        schema={schema}
        tableColumns={tableColumns}
        testIdAttributes={TestIdUtil.createAttributes('UsersAdminPage')}
        title={t`Users`}
        updateOne={updateOne}
      />
      <EpiUserRightsDialog ref={epiUserRightsDialogRef} />
    </>
  );
};
