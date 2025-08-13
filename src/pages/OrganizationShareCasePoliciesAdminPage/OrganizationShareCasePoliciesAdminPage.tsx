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

import type { OrganizationShareCasePolicy } from '../../api';
import {
  AbacApi,
  CommandName,
} from '../../api';
import { useCaseTypeColSetOptionsQuery } from '../../dataHooks/useCaseTypeColSetsQuery';
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

type FormFields = Pick<
  OrganizationShareCasePolicy,
  'organization_id' |
  'data_collection_id' |
  'case_type_set_id' |
  'from_data_collection_id' |
  'add_case' |
  'remove_case' |
  'add_case_set' |
  'remove_case_set' |
  'is_active'
>;

export const OrganizationShareCasePoliciesAdminPage = () => {
  const [t] = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const caseTypeColSetOptionsQuery = useCaseTypeColSetOptionsQuery();
  const caseTypeSetOptions = useCaseTypeSetOptionsQuery();

  const nameFactory = useOrganizationCasePolicyNameFactory();

  const loadables = useArray([nameFactory, organizationOptionsQuery, dataCollectionOptionsQuery, caseTypeColSetOptionsQuery, caseTypeSetOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.getInstance().organizationShareCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: OrganizationShareCasePolicy) => {
    return await AbacApi.getInstance().organizationShareCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: OrganizationShareCasePolicy) => {
    return (await AbacApi.getInstance().organizationShareCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.getInstance().organizationShareCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: OrganizationShareCasePolicy) => {
    return nameFactory.getName(item);
  }, [nameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      organization_id: string().uuid4().required().max(100),
      data_collection_id: string().uuid4().required().max(100),
      from_data_collection_id: string().uuid4().required().max(100),
      case_type_set_id: string().uuid4().required().max(100),
      add_case: boolean().required(),
      remove_case: boolean().required(),
      add_case_set: boolean().required(),
      remove_case_set: boolean().required(),
      is_active: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'organization_id',
        label: t`Organization`,
        options: organizationOptionsQuery.options,
        loading: organizationOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'data_collection_id',
        label: t`Data collection`,
        options: dataCollectionOptionsQuery.options,
        loading: dataCollectionOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'from_data_collection_id',
        label: t`From data collection`,
        options: dataCollectionOptionsQuery.options,
        loading: dataCollectionOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_set_id',
        label: t`Case type set`,
        options: caseTypeSetOptions.options,
        loading: caseTypeSetOptions.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'add_case',
        label: t`Add case`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'remove_case',
        label: t`Remove case`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'add_case_set',
        label: t`Add case set`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'remove_case_set',
        label: t`Remove case set`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
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
