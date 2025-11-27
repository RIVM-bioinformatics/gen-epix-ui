import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import type { Site } from '../../api';
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

type FormFields = Omit<Site, 'id' | 'organization_id' | 'organization'>;

export const OrganizationSitesAdminPage = () => {
  const { organizationId } = useParams();
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.instance.sitesGetAll({ signal })).data;
  }, []);

  const fetchAllSelect = useCallback((sites: Site[]) => {
    return sites.filter((site) => site.organization_id === organizationId);
  }, [organizationId]);

  const updateOne = useCallback(async (variables: FormFields, item: Site) => {
    return (await OrganizationApi.instance.sitesPutOne(item.id, {
      id: item.id,
      name: variables.name,
      organization_id: organizationId,
    })).data;
  }, [organizationId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.instance.sitesPostOne({
      name: variables.name,
      organization_id: organizationId,
    })).data;
  }, [organizationId]);

  const deleteOne = useCallback(async (item: Site) => {
    return await OrganizationApi.instance.sitesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Site>[] => {
    return [
      TableUtil.createTextColumn<Site>({ id: 'name', name: t`Name`, advancedSort: true }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: Site): Site => {
    return {
      id: previousItem.id,
      organization_id: previousItem.organization_id,
      ...variables,
    };
  }, []);

  const doesUserHavePermissionToViewContacts = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.ContactCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const extraActionsFactory = useCallback((params: TableRowParams<Site>) => {
    if (!doesUserHavePermissionToViewContacts) {
      return [];
    }

    return [(
      <MenuItem
        key={'custom-action-1'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={async () => await RouterManager.instance.router.navigate({
          pathname: `/management/organizations/${params.row.organization_id}/sites/${params.row.id}/contacts`,
        })}
      >
        <ListItemIcon />
        <ListItemText>
          {t`Manage contacts`}
        </ListItemText>
      </MenuItem>
    )];
  }, [doesUserHavePermissionToViewContacts, t]);

  const editDialogExtraActionsFactory = useCallback((item: Site): DialogAction[] =>{
    if (!doesUserHavePermissionToViewContacts) {
      return [];
    }
    return [
      {
        ...TestIdUtil.createAttributes('OrganizationSitesAdminPage-ManageContactsButton'),
        label: t`Manage contacts`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/organizations/${item.organization_id}/sites/${item.id}/contacts`,
        }),
      },
    ];
  }, [doesUserHavePermissionToViewContacts, t]);

  return (
    <CrudPage<FormFields, Site>
      createOne={createOne}
      crudCommandType={CommandName.SiteCrudCommand}
      createItemDialogTitle={t`Create new site`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      editDialogExtraActionsFactory={editDialogExtraActionsFactory}
      extraActionsFactory={extraActionsFactory}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      resourceQueryKeyBase={QUERY_KEY.SITES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationSitesAdminPage')}
      title={t`Organization Sites`}
      updateOne={updateOne}
    />
  );
};
