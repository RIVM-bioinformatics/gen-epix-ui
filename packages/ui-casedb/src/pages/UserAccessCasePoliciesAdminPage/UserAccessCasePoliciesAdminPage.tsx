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
import type { CaseDbApiPermission, CaseDbUserAccessCasePolicy } from '@gen-epix/api-casedb';
import {
  CaseDbAbacApi,
  CaseDbCommandName,
} from '@gen-epix/api-casedb';
import type {
  FormFieldDefinition,
  OmitWithMetaData,
  TableColumn,
} from '@gen-epix/ui';
import {
  CrudPage,
  FORM_FIELD_DEFINITION_TYPE,
  TableUtil,
  TestIdUtil,
  useArray,
  useUserOptionsQuery,
} from '@gen-epix/ui';

import { useColSetOptionsQuery } from '../../dataHooks/useColSetsQuery';
import { useCaseTypeSetOptionsQuery } from '../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { CASEDB_QUERY_KEY } from '../../data/query';
import { useUserCasePolicyNameFactory } from '../../hooks/useUserCasePolicyNameFactory';

type FormFields = OmitWithMetaData<CaseDbUserAccessCasePolicy, 'case_type_set' | 'data_collection' | 'read_col_set' | 'user' | 'write_col_set'>;

export const UserAccessCasePoliciesAdminPage = () => {
  const { t } = useTranslation();
  const userOptionsQuery = useUserOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const colSetOptionsQuery = useColSetOptionsQuery();
  const caseTypeSetOptions = useCaseTypeSetOptionsQuery();

  const nameFactory = useUserCasePolicyNameFactory();

  const loadables = useArray([nameFactory, userOptionsQuery, dataCollectionOptionsQuery, colSetOptionsQuery, caseTypeSetOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbAbacApi.getInstance().userAccessCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbUserAccessCasePolicy) => {
    return await CaseDbAbacApi.getInstance().userAccessCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbUserAccessCasePolicy) => {
    return (await CaseDbAbacApi.getInstance().userAccessCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbAbacApi.getInstance().userAccessCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbUserAccessCasePolicy) => {
    return nameFactory.getName(item);
  }, [nameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      add_case: boolean().required(),
      add_case_set: boolean().required(),
      case_type_set_id: string().uuid4().required().max(100),
      data_collection_id: string().uuid4().required().max(100),
      is_active: boolean().required(),
      read_case_set: boolean().required(),
      read_col_set_id: string().uuid4().required().max(100),
      remove_case: boolean().required(),
      remove_case_set: boolean().required(),
      user_id: string().uuid4().required().max(100),
      write_case_set: boolean().required(),
      write_col_set_id: string().uuid4().nullable().notRequired().max(100),
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
        label: t`Case type set`,
        loading: caseTypeSetOptions.isLoading,
        name: 'case_type_set_id',
        options: caseTypeSetOptions.options,
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
        label: t`Is active`,
        name: 'is_active',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [colSetOptionsQuery.isLoading, colSetOptionsQuery.options, caseTypeSetOptions.isLoading, caseTypeSetOptions.options, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, userOptionsQuery.isLoading, userOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbUserAccessCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<CaseDbUserAccessCasePolicy>({ id: 'user_id', name: t`User`, options: userOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbUserAccessCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbUserAccessCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptions.options }),
      TableUtil.createOptionsColumn<CaseDbUserAccessCasePolicy>({ id: 'read_col_set_id', name: t`Read column set`, options: colSetOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbUserAccessCasePolicy>({ id: 'write_col_set_id', name: t`Write column set`, options: colSetOptionsQuery.options }),

      TableUtil.createBooleanColumn<CaseDbUserAccessCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<CaseDbUserAccessCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<CaseDbUserAccessCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<CaseDbUserAccessCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),
      TableUtil.createBooleanColumn<CaseDbUserAccessCasePolicy>({ id: 'read_case_set', name: t`Read case set` }),
      TableUtil.createBooleanColumn<CaseDbUserAccessCasePolicy>({ id: 'write_case_set', name: t`Write case set` }),

      TableUtil.createBooleanColumn<CaseDbUserAccessCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [colSetOptionsQuery.options, caseTypeSetOptions.options, dataCollectionOptionsQuery.options, userOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, CaseDbUserAccessCasePolicy, CaseDbUserAccessCasePolicy, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new user access case policy`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.UserAccessCasePolicyCrudCommand}
      defaultSortByField={'user_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.USER_ACCESS_CASE_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('UserAccessCasePoliciesAdminPage')}
      title={t`User access case policies`}
      updateOne={updateOne}
    />
  );
};
