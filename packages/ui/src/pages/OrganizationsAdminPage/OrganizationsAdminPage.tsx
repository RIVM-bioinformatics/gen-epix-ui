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
import omit from 'lodash/omit';
import type {
  CaseDbApiPermission,
  CaseDbOrganization,
} from '@gen-epix/api-casedb';
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
import { useIdentifierIssuerOptionsQuery } from '../../dataHooks/useIdentifierIssuerQuery';
import { useArray } from '../../hooks/useArray';
import { useOrganizationIdentifierIssuerLinksQuery } from '../../dataHooks/useOrganizationIdentifierIssuerLinksQuery';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<TableData>;

type TableData = { identifierIssuerIds: string[] } & CaseDbOrganization;

export const OrganizationsAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const organizationIdentifierIssuerLinksQuery = useOrganizationIdentifierIssuerLinksQuery();

  const loadables = useArray([identifierIssuerOptionsQuery, organizationIdentifierIssuerLinksQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOrganizationApi.instance.organizationsGetAll({ signal }))?.data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbOrganization) => {
    await CaseDbOrganizationApi.instance.organizationsPutIdentifierIssuers(item.id, {
      organization_identifier_issuer_links: variables.identifierIssuerIds.map(identifier_issuer_id => ({
        identifier_issuer_id,
        organization_id: item.id,
      })),
    });
    return (await CaseDbOrganizationApi.instance.organizationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseDbOrganizationApi.instance.organizationsPostOne(omit(variables, ['identifierIssuerIds']))).data;
    await CaseDbOrganizationApi.instance.organizationsPutIdentifierIssuers(resultItem.id, {
      organization_identifier_issuer_links: variables.identifierIssuerIds.map(identifier_issuer_id => ({
        identifier_issuer_id,
        organization_id: resultItem.id,
      })),
    });
    return resultItem;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbOrganization) => {
    return await CaseDbOrganizationApi.instance.organizationsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: CaseDbOrganization) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      description: SchemaUtil.description,
      identifierIssuerIds: array().of(string().uuid4()).min(0).required(),
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
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        label: t`Identifier issuers`,
        loading: identifierIssuerOptionsQuery.isLoading,
        name: 'identifierIssuerIds',
        options: identifierIssuerOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [identifierIssuerOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ advancedSort: true, id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<TableData>({ id: 'code', name: t`Code` }),
      {
        displayValueGetter: (item) => `${item.row.identifierIssuerIds.length} / ${identifierIssuerOptionsQuery.options.length}`,
        headerName: t`Identifier issuer count`,
        id: 'numIdentifierIssuers',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (item) => item.row.identifierIssuerIds.length,
        widthFlex: 0.5,
      },
    ];
  }, [identifierIssuerOptionsQuery.options.length, t]);

  const subPages = useMemo<CrudPageSubPage<CaseDbOrganization>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CaseDbCommandName.SiteCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        getPathName: (item: CaseDbOrganization) => `/management/organizations/${item.id}/sites`,
        label: t`Manage sites`,
      } satisfies CrudPageSubPage<CaseDbOrganization>,
    ];
  }, [t]);

  const convertToTableData = useCallback((items: CaseDbOrganization[]) => {
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

  const extraPermissions = useMemo<CaseDbApiPermission[]>(() => [
    { command_name: CaseDbCommandName.OrganizationIdentifierIssuerLinkUpdateAssociationCommand, permission_type: CaseDbPermissionType.EXECUTE },
  ], []);

  return (
    <CrudPage<FormFields, CaseDbOrganization, TableData>
      associationQueryKeys={associationQueryKeys}
      convertToTableData={convertToTableData}
      createItemDialogTitle={t`Create new organization`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.OrganizationCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      extraCreateOnePermissions={extraPermissions}
      extraDeleteOnePermissions={extraPermissions}
      extraUpdateOnePermissions={extraPermissions}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATIONS}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationsAdminPage')}
      title={t`Organizations`}
      updateOne={updateOne}
    />
  );
};
