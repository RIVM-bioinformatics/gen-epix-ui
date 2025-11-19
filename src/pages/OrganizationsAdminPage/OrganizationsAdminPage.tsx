import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import type { Organization } from '../../api';
import {
  OrganizationApi,
  CommandName,
  PermissionType,
} from '../../api';
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
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { DialogAction } from '../../components/ui/Dialog';

type FormFields = Pick<Organization, 'name' | 'legal_entity_code'>;

export const OrganizationsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.getInstance().organizationsGetAll({ signal }))?.data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Organization) => {
    return (await OrganizationApi.getInstance().organizationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.getInstance().organizationsPostOne(variables)).data;
  }, []);

  const deleteOne = useCallback(async (item: Organization) => {
    return await OrganizationApi.getInstance().organizationsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: Organization) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      legal_entity_code: string().extendedAlphaNumeric().required().max(100),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'legal_entity_code',
        label: t`Legal entity code`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Organization>[] => {
    return [
      TableUtil.createTextColumn<Organization>({ id: 'name', name: t`Name`, advancedSort: true }),
      TableUtil.createTextColumn<Organization>({ id: 'legal_entity_code', name: t`Legal entity code` }),
    ];
  }, [t]);

  const doesUserHavePermissionToViewSites = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.ContactCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const extraActionsFactory = useCallback((params: TableRowParams<Organization>) => {
    if (!doesUserHavePermissionToViewSites) {
      return [];
    }

    return [(
      <MenuItem
        key={'custom-action-1'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={async () => await RouterManager.instance.router.navigate({
          pathname: `/management/organizations/${params.row.id}/sites`,
        })}
      >
        <ListItemIcon />
        <ListItemText>
          {t`Manage sites`}
        </ListItemText>
      </MenuItem>
    )];
  }, [doesUserHavePermissionToViewSites, t]);

  const editDialogExtraActionsFactory = useCallback((item: Organization): DialogAction[] =>{
    if (!doesUserHavePermissionToViewSites) {
      return [];
    }
    return [
      {
        ...TestIdUtil.createAttributes('OrganizationsAdminPage-ManageSitesButton'),
        label: t`Manage sites`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/organizations/${item.id}/sites`,
        }),
      },
    ];
  }, [doesUserHavePermissionToViewSites, t]);

  return (
    <CrudPage<FormFields, Organization>
      createOne={createOne}
      crudCommandType={CommandName.OrganizationCrudCommand}
      createItemDialogTitle={t`Create new organization`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      editDialogExtraActionsFactory={editDialogExtraActionsFactory}
      extraActionsFactory={extraActionsFactory}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationsAdminPage')}
      title={t`Organizations`}
      updateOne={updateOne}
    />
  );
};
