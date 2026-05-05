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
import type { CaseDbUserShareCasePolicy } from '@gen-epix/api-casedb';
import {
  CaseDbAbacApi,
  CaseDbCommandName,
} from '@gen-epix/api-casedb';

import { useColSetsQuery } from '../../dataHooks/useColSetsQuery';
import { useCaseTypeSetOptionsQuery } from '../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useUserOptionsQuery } from '../../dataHooks/useUsersQuery';
import { useUserCasePolicyNameFactory } from '../../hooks/useUserCasePolicyNameFactory';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';

type FormFields = OmitWithMetaData<CaseDbUserShareCasePolicy, 'case_type_set' | 'data_collection' | 'from_data_collection' | 'user'>;

export const UserShareCasePoliciesAdminPage = () => {
  const { t } = useTranslation();
  const userOptionsQuery = useUserOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const colSetOptionsQuery = useColSetsQuery();
  const caseTypeSetOptionsQuery = useCaseTypeSetOptionsQuery();

  const nameFactory = useUserCasePolicyNameFactory();

  const loadables = useArray([userOptionsQuery, dataCollectionOptionsQuery, colSetOptionsQuery, caseTypeSetOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbAbacApi.instance.userShareCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbUserShareCasePolicy) => {
    return await CaseDbAbacApi.instance.userShareCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbUserShareCasePolicy) => {
    return (await CaseDbAbacApi.instance.userShareCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbAbacApi.instance.userShareCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbUserShareCasePolicy) => {
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
      remove_case: boolean().required(),
      remove_case_set: boolean().required(),
      user_id: string().uuid4().required().max(100),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`User`,
        loading: userOptionsQuery.isLoading,
        name: 'user_id',
        options: userOptionsQuery.options,
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
        loading: caseTypeSetOptionsQuery.isLoading,
        name: 'case_type_set_id',
        options: caseTypeSetOptionsQuery.options,
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
  }, [caseTypeSetOptionsQuery.isLoading, caseTypeSetOptionsQuery.options, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, userOptionsQuery.isLoading, userOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbUserShareCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<CaseDbUserShareCasePolicy>({ id: 'user_id', name: t`User`, options: userOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbUserShareCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbUserShareCasePolicy>({ id: 'from_data_collection_id', name: t`From collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbUserShareCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptionsQuery.options }),

      TableUtil.createBooleanColumn<CaseDbUserShareCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<CaseDbUserShareCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<CaseDbUserShareCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<CaseDbUserShareCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),

      TableUtil.createBooleanColumn<CaseDbUserShareCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [caseTypeSetOptionsQuery.options, dataCollectionOptionsQuery.options, userOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, CaseDbUserShareCasePolicy>
      createItemDialogTitle={t`Create new user share case policy`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.UserShareCasePolicyCrudCommand}
      defaultSortByField={'user_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.USER_SHARE_CASE_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('UserShareCasePoliciesAdminPage')}
      title={t`User share case policies`}
      updateOne={updateOne}
    />
  );
};
