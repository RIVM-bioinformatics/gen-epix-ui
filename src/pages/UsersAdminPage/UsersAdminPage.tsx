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

import type { User } from '../../api';
import { OrganizationApi } from '../../api';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import { useRoleOptionsQuery } from '../../dataHooks/useRolesQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
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

type FormFields = Pick<User, 'email' | 'is_active' | 'roles'>;

export const UsersAdminPage = () => {
  const [t] = useTranslation();
  const roleOptionsQuery = useRoleOptionsQuery();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const epiUserRightsDialogRef = useRef<EpiUserRightsDialogRefMethods>(null);

  const loadables = useArray([roleOptionsQuery, organizationOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const users = (await OrganizationApi.getInstance().usersGetAll({ signal }))?.data;

    return users;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: User) => {
    return (await OrganizationApi.getInstance().usersPutOne(item.id, {
      is_active: variables.is_active,
      organization_id: item.organization_id,
      roles: variables.roles,
      email: item.email,
    })).data;
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
        options: roleOptionsQuery.options,
        loading: roleOptionsQuery.isLoading,
        multiple: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [roleOptionsQuery.isLoading, roleOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<User>[] => {
    return [
      TableUtil.createTextColumn<User>({ id: 'name', name: t`Name`, advancedSort: true }),
      TableUtil.createOptionsColumn<User>({ id: 'organization_id', name: t`Organization`, options: organizationOptionsQuery.options }),
      TableUtil.createTextColumn<User>({ id: 'email', name: t`E-Mail` }),
      TableUtil.createOptionsColumn<User>({ id: 'roles', name: t`Roles`, options: roleOptionsQuery.options }),
      TableUtil.createBooleanColumn<User>({ id: 'is_active', name: t`Is active` }),
    ];
  }, [organizationOptionsQuery.options, roleOptionsQuery.options, t]);

  const extraActionsFactory = useCallback((params: TableRowParams<User>) => {
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
  }, [t]);

  const getEditIntermediateItem = useCallback((variables: FormFields, previousItem: User): User => {
    return {
      ...variables,
      id: previousItem.id,
      is_active: previousItem.is_active,
      organization_id: previousItem.organization_id,
      name: previousItem.name,
    };
  }, []);


  const editDialogExtraActionsFactory = useCallback((item: User): DialogAction[] =>{
    return [
      {
        ...TestIdUtil.createAttributes('UsersAdminPage-epiUserRightsButton'),
        label: t`View effective rights`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/users/${item.id}/effective-rights`,
        }),
      },
    ];
  }, [t]);

  return (
    <>
      <CrudPage<FormFields, User>
        canEditItem={canEditItem}
        defaultSortByField={'name'}
        defaultSortDirection={'asc'}
        editDialogExtraActionsFactory={editDialogExtraActionsFactory}
        extraActionsFactory={extraActionsFactory}
        fetchAll={fetchAll}
        formFieldDefinitions={formFieldDefinitions}
        getEditIntermediateItem={getEditIntermediateItem}
        getName={getName}
        loadables={loadables}
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
