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
import { useCaseTypeColSetOptions } from '../../dataHooks/useCaseTypeColSets';
import { useCaseTypeSetOptions } from '../../dataHooks/useCaseTypeSets';
import { useDataCollectionOptions } from '../../dataHooks/useDataCollections';
import { useOrganizationOptions } from '../../dataHooks/useOrganizations';
import { useOrganizationCasePolicyNameFactory } from '../../hooks/useOrganizationCasePolicyNameFactory';
import type { Loadable } from '../../models/dataHooks';
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
  const organizationOptions = useOrganizationOptions();
  const dataCollectionOptions = useDataCollectionOptions();
  const caseTypeColSetOptions = useCaseTypeColSetOptions();
  const caseTypeSetOptions = useCaseTypeSetOptions();

  const nameFactory = useOrganizationCasePolicyNameFactory();

  const loadables = useMemo<Loadable[]>(() => [nameFactory, organizationOptions, dataCollectionOptions, caseTypeColSetOptions, caseTypeSetOptions], [nameFactory, caseTypeSetOptions, caseTypeColSetOptions, dataCollectionOptions, organizationOptions]);

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
        options: organizationOptions.options,
        loading: organizationOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'data_collection_id',
        label: t`Data collection`,
        options: dataCollectionOptions.options,
        loading: dataCollectionOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'from_data_collection_id',
        label: t`From data collection`,
        options: dataCollectionOptions.options,
        loading: dataCollectionOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_set_id',
        label: t`Case type set`,
        options: caseTypeSetOptions.options,
        loading: caseTypeSetOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'add_case',
        label: t`Add case`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'remove_case',
        label: t`Remove case`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'add_case_set',
        label: t`Add case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'remove_case_set',
        label: t`Remove case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
      },
    ];
  }, [caseTypeSetOptions.isLoading, caseTypeSetOptions.options, dataCollectionOptions.isLoading, dataCollectionOptions.options, organizationOptions.isLoading, organizationOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<OrganizationShareCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'organization_id', name: t`Organization`, options: organizationOptions.options }),
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptions.options }),
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'from_data_collection_id', name: t`From collection`, options: dataCollectionOptions.options }),
      TableUtil.createOptionsColumn<OrganizationShareCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptions.options }),

      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),

      TableUtil.createBooleanColumn<OrganizationShareCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [caseTypeSetOptions.options, dataCollectionOptions.options, organizationOptions.options, t]);

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
