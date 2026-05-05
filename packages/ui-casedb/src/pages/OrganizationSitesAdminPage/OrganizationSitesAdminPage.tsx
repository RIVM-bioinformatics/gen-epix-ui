import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import { useParams } from 'react-router-dom';
import type { CaseDbSite } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOrganizationApi,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';

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

type FormFields = OmitWithMetaData<CaseDbSite, 'organization_id' | 'organization'>;

export const OrganizationSitesAdminPage = () => {
  const { organizationId } = useParams();
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOrganizationApi.getInstance().sitesGetAll({ signal })).data;
  }, []);

  const fetchAllSelect = useCallback((sites: CaseDbSite[]) => {
    return sites.filter((site) => site.organization_id === organizationId);
  }, [organizationId]);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbSite) => {
    return (await CaseDbOrganizationApi.getInstance().sitesPutOne(item.id, {
      id: item.id,
      name: variables.name,
      organization_id: organizationId,
    })).data;
  }, [organizationId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOrganizationApi.getInstance().sitesPostOne({
      name: variables.name,
      organization_id: organizationId,
    })).data;
  }, [organizationId]);

  const deleteOne = useCallback(async (item: CaseDbSite) => {
    return await CaseDbOrganizationApi.getInstance().sitesDeleteOne(item.id);
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

  const tableColumns = useMemo((): TableColumn<CaseDbSite>[] => {
    return [
      TableUtil.createTextColumn<CaseDbSite>({ advancedSort: true, id: 'name', name: t`Name` }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: CaseDbSite): CaseDbSite => {
    return {
      id: previousItem.id,
      organization_id: previousItem.organization_id,
      ...variables,
    };
  }, []);

  const subPages = useMemo<CrudPageSubPage<CaseDbSite>[]>(() => {
    if (!AuthorizationManager.getInstance().doesUserHavePermission([
      { command_name: CaseDbCommandName.ContactCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        getPathName: (item: CaseDbSite) => `/management/organizations/${item.organization_id}/sites/${item.id}/contacts`,
        label: t`Manage contacts`,
      } satisfies CrudPageSubPage<CaseDbSite>,
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbSite>
      createItemDialogTitle={t`Create new site`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.SiteCrudCommand}
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
