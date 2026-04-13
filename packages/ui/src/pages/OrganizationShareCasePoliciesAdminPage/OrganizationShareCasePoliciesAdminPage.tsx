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
import type { OrganizationShareCasePolicy } from '@gen-epix/api-casedb';
import {
  AbacApi,
  CommandName,
} from '@gen-epix/api-casedb';

import { useColSetOptionsQuery } from '../../dataHooks/useColSetsQuery';
import { useCaseTypeSetOptionsQuery } from '../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import { useOrganizationCasePolicyNameFactory } from '../../hooks/useOrganizationCasePolicyNameFactory';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';

type FormFields = OmitWithMetaData<OrganizationShareCasePolicy, 'case_type_set' | 'data_collection' | 'from_data_collection' | 'organization'>;

export const OrganizationShareCasePoliciesAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const colSetOptionsQuery = useColSetOptionsQuery();
  const caseTypeSetOptions = useCaseTypeSetOptionsQuery();

  const nameFactory = useOrganizationCasePolicyNameFactory();

  const loadables = useArray([nameFactory, organizationOptionsQuery, dataCollectionOptionsQuery, colSetOptionsQuery, caseTypeSetOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.instance.organizationShareCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: OrganizationShareCasePolicy) => {
    return await AbacApi.instance.organizationShareCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: OrganizationShareCasePolicy) => {
    return (await AbacApi.instance.organizationShareCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.instance.organizationShareCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: OrganizationShareCasePolicy) => {
    return nameFactory.getName(item);
  }, [nameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      add_case: boolean().required(),
      add_case_set: boolean().required(),
      case_type_set_id: string().uuid4().required().max(100),
      data_collection_id: string().uuid4().required().max(100),
      from_data_collection_id: string().uuid4().required().max(100),
      is_active: boolean().required(),
      organization_id: string().uuid4().required().max(100),
      remove_case: boolean().required(),
      remove_case_set: boolean().required(),
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
        label: t`From data collection`,
        loading: dataCollectionOptionsQuery.isLoading,
        name: 'from_data_collection_id',
        options: dataCollectionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Case type set`,
        loading: caseTypeSetOptions.isLoading,
        name: 'case_type_set_id',
        options: caseTypeSetOptions.options,
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
        label: t`Is active`,
        name: 'is_active',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseTypeSetOptions.isLoading, caseTypeSetOptions.options, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, organizationOptionsQuery.isLoading, organizationOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<OrganizationShareCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'organization_id', name: t`Organization`, options: organizationOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'from_data_collection_id', name: t`From collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptions.options }),

      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),

      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [caseTypeSetOptions.options, dataCollectionOptionsQuery.options, organizationOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, OrganizationShareCasePolicy>
      createItemDialogTitle={t`Create new organization share case policy`}
      createOne={createOne}
      crudCommandType={CommandName.OrganizationShareCasePolicyCrudCommand}
      defaultSortByField={'organization_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATION_SHARE_CASE_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationShareCasePoliciesAdminPage')}
      title={t`Organization share case policies`}
      updateOne={updateOne}
    />
  );
};
