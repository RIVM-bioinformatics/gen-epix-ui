import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import { useParams } from 'react-router-dom';
import type { CommonDbSite } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';
import { ConfigManager } from '../../classes/managers/ConfigManager';

type FormFields = OmitWithMetaData<CommonDbSite, 'organization_id' | 'organization'>;

export const OrganizationSitesAdminPage = () => {
  const { organizationId } = useParams();
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await ConfigManager.getInstance().config.organizationApi.sitesGetAll({ signal })).data;
  }, []);

  const fetchAllSelect = useCallback((sites: CommonDbSite[]) => {
    return sites.filter((site) => site.organization_id === organizationId);
  }, [organizationId]);

  const updateOne = useCallback(async (variables: FormFields, item: CommonDbSite) => {
    return (await ConfigManager.getInstance().config.organizationApi.sitesPutOne(item.id, {
      id: item.id,
      name: variables.name,
      organization_id: organizationId,
    })).data;
  }, [organizationId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await ConfigManager.getInstance().config.organizationApi.sitesPostOne({
      name: variables.name,
      organization_id: organizationId,
    })).data;
  }, [organizationId]);

  const deleteOne = useCallback(async (item: CommonDbSite) => {
    return await ConfigManager.getInstance().config.organizationApi.sitesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: SchemaUtil.name,
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CommonDbSite>[] => {
    return [
      TableUtil.createTextColumn<CommonDbSite>({ advancedSort: true, id: 'name', name: t`Name` }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: CommonDbSite): CommonDbSite => {
    return {
      id: previousItem.id,
      organization_id: previousItem.organization_id,
      ...variables,
    };
  }, []);

  const subPages = useMemo<CrudPageSubPage<CommonDbSite>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        getPathName: (item: CommonDbSite) => `/management/organizations/${item.organization_id}/sites/${item.id}/contacts`,
        label: t`Manage contacts`,
      } satisfies CrudPageSubPage<CommonDbSite>,
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CommonDbSite>
      createItemDialogTitle={t`Create new site`}
      createOne={createOne}
      crudCommandType={CommonDbCommandName.SiteCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      resourceQueryKeyBase={QUERY_KEY.SITES}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationSitesAdminPage')}
      title={t`Organization Sites`}
      updateOne={updateOne}
    />
  );
};
