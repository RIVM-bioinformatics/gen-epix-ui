import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';

import type { Organization } from '../../api';
import {
  OrganizationApi,
  CommandName,
  PermissionType,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { useIdentifierIssuerOptionsQuery } from '../../dataHooks/useIdentifierIssuerQuery';
import { useArray } from '../../hooks/useArray';
import { useOrganizationIdentifierIssuerLinksQuery } from '../../dataHooks/useOrganizationIdentifierIssuerLinksQuery';

type TableData = Organization & { identifierIssuerIds: string[] };

type FormFields = Pick<TableData, 'name' | 'legal_entity_code' | 'identifierIssuerIds'>;

export const OrganizationsAdminPage = () => {
  const [t] = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const organizationIdentifierIssuerLinksQuery = useOrganizationIdentifierIssuerLinksQuery();

  const loadables = useArray([identifierIssuerOptionsQuery, organizationIdentifierIssuerLinksQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.instance.organizationsGetAll({ signal }))?.data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Organization) => {
    // OrganizationApi.instance.organizationsPutIdentifierIssuers(item.id, {
    //   organization_identifier_issuer_links
    // })
    return (await OrganizationApi.instance.organizationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.instance.organizationsPostOne(variables)).data;
  }, []);

  const deleteOne = useCallback(async (item: Organization) => {
    return await OrganizationApi.instance.organizationsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: Organization) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      legal_entity_code: string().extendedAlphaNumeric().required().max(100),
      identifierIssuerIds: array().of(string().uuid4()).min(0).required(),
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
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        name: 'identifierIssuerIds',
        label: t`Identifier issuers`,
        options: identifierIssuerOptionsQuery.options,
        loading: identifierIssuerOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [identifierIssuerOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name`, advancedSort: true }),
      TableUtil.createTextColumn<TableData>({ id: 'legal_entity_code', name: t`Legal entity code` }),
      {
        type: 'number',
        id: 'numIdentifierIssuers',
        textAlign: 'right',
        valueGetter: (item) => item.row.identifierIssuerIds.length,
        displayValueGetter: (item) => `${item.row.identifierIssuerIds.length} / ${identifierIssuerOptionsQuery.options.length}`,
        headerName: t`Identifier issuer count`,
        widthFlex: 0.5,
        isInitiallyVisible: true,
      },
    ];
  }, [identifierIssuerOptionsQuery.options.length, t]);

  const subPages = useMemo<CrudPageSubPage<Organization>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.SiteCrudCommand, permission_type: PermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        label: t`Manage sites`,
        getPathName: (item: Organization) => `/management/organizations/${item.id}/sites`,
      } satisfies CrudPageSubPage<Organization>,
    ];
  }, [t]);

  const convertToTableData = useCallback((items: Organization[]) => {
    if (!items || !organizationIdentifierIssuerLinksQuery.data) {
      return [];
    }
    return items.map<TableData>((item) => {
      const identifierIssuerIds = organizationIdentifierIssuerLinksQuery.data.filter(link => link.organization_id === item.id).map(link => link.identifier_issuer_id);
      return {
        ...item,
        identifierIssuerIds,
      } satisfies TableData;
    });
  }, [organizationIdentifierIssuerLinksQuery.data]);

  const associationQueryKeys = useMemo(() => [
    [QUERY_KEY.IDENTIFIER_ISSUER_LINKS],
  ], []);

  return (
    <CrudPage<FormFields, Organization, TableData>
      associationQueryKeys={associationQueryKeys}
      convertToTableData={convertToTableData}
      createOne={createOne}
      loadables={loadables}
      crudCommandType={CommandName.OrganizationCrudCommand}
      createItemDialogTitle={t`Create new organization`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      subPages={subPages}
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
