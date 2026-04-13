import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  object,
  string,
} from 'yup';
import type { OrganizationAccessCasePolicy } from '@gen-epix/api-casedb';
import {
  AbacApi,
  CommandName,
} from '@gen-epix/api-casedb';

import { useColSetOptionsQuery } from '../../dataHooks/useColSetsQuery';
import { useCaseTypeSetOptionsQuery } from '../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import { useArray } from '../../hooks/useArray';
import { useOrganizationCasePolicyNameFactory } from '../../hooks/useOrganizationCasePolicyNameFactory';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';

type FormFields = OmitWithMetaData<OrganizationAccessCasePolicy, 'case_type_set' | 'data_collection' | 'organization' | 'read_col_set' | 'write_col_set'>;

export const OrganizationAccessCasePoliciesAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const colSetOptionsQuery = useColSetOptionsQuery();
  const caseTypeSetOptionsQuery = useCaseTypeSetOptionsQuery();

  const nameFactory = useOrganizationCasePolicyNameFactory();

  const loadables = useArray([nameFactory, organizationOptionsQuery, dataCollectionOptionsQuery, colSetOptionsQuery, caseTypeSetOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.instance.organizationAccessCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: OrganizationAccessCasePolicy) => {
    return await AbacApi.instance.organizationAccessCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: OrganizationAccessCasePolicy) => {
    return (await AbacApi.instance.organizationAccessCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.instance.organizationAccessCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: OrganizationAccessCasePolicy) => {
    return nameFactory.getName(item);
  }, [nameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      add_case: boolean().required(),
      add_case_set: boolean().required(),
      case_type_set_id: string().uuid4().required().max(100),
      data_collection_id: string().uuid4().required().max(100),
      is_active: boolean().required(),
      is_private: boolean().required(),
      organization_id: string().uuid4().required().max(100),
      read_case_set: boolean().required(),
      read_col_set_id: string().uuid4().required().max(100),
      remove_case: boolean().required(),
      remove_case_set: boolean().required(),
      write_case_set: boolean().required(),
      write_col_set_id: string().uuid4().nullable().notRequired().max(100),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Organization`,
        loading: organizationOptionsQuery.isLoading,
        name: 'organization_id',
        options: organizationOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Data collection`,
        loading: dataCollectionOptionsQuery.isLoading,
        name: 'data_collection_id',
        options: dataCollectionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Case type set`,
        loading: caseTypeSetOptionsQuery.isLoading,
        name: 'case_type_set_id',
        options: caseTypeSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Read column set`,
        loading: colSetOptionsQuery.isLoading,
        name: 'read_col_set_id',
        options: colSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Write column set`,
        loading: colSetOptionsQuery.isLoading,
        name: 'write_col_set_id',
        options: colSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Add case`,
        name: 'add_case',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Remove case`,
        name: 'remove_case',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Add case set`,
        name: 'add_case_set',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Remove case set`,
        name: 'remove_case_set',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Read case set`,
        name: 'read_case_set',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Write case set`,
        name: 'write_case_set',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Is private`,
        name: 'is_private',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Is active`,
        name: 'is_active',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [colSetOptionsQuery.isLoading, colSetOptionsQuery.options, caseTypeSetOptionsQuery.isLoading, caseTypeSetOptionsQuery.options, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, organizationOptionsQuery.isLoading, organizationOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<OrganizationAccessCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'organization_id', name: t`Organization`, options: organizationOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'read_col_set_id', name: t`Read column set`, options: colSetOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'write_col_set_id', name: t`Write column set`, options: colSetOptionsQuery.options }),

      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'read_case_set', name: t`Read case set` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'write_case_set', name: t`Write case set` }),

      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'is_private', name: t`Private` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [colSetOptionsQuery.options, caseTypeSetOptionsQuery.options, dataCollectionOptionsQuery.options, organizationOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, OrganizationAccessCasePolicy>
      createItemDialogTitle={t`Create new organization access case policy`}
      createOne={createOne}
      crudCommandType={CommandName.OrganizationAccessCasePolicyCrudCommand}
      defaultSortByField={'organization_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationAccessCasePoliciesAdminPage')}
      title={t`Organization access case policies`}
      updateOne={updateOne}
    />
  );
};
