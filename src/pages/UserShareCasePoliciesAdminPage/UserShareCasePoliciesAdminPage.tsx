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

import type { UserShareCasePolicy } from '../../api';
import {
  AbacApi,
  CommandName,
} from '../../api';
import { useCaseTypeColSetOptionsQuery } from '../../dataHooks/useCaseTypeColSetsQuery';
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

type FormFields = Pick<
  UserShareCasePolicy,
  'user_id' |
  'data_collection_id' |
  'case_type_set_id' |
  'from_data_collection_id' |
  'add_case' |
  'remove_case' |
  'add_case_set' |
  'remove_case_set' |
  'is_active'
>;

export const UserShareCasePoliciesAdminPage = () => {
  const [t] = useTranslation();
  const userOptionsQuery = useUserOptionsQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const caseTypeColSetOptionsQuery = useCaseTypeColSetOptionsQuery();
  const caseTypeSetOptionsQuery = useCaseTypeSetOptionsQuery();

  const nameFactory = useUserCasePolicyNameFactory();

  const loadables = useArray([userOptionsQuery, dataCollectionOptionsQuery, caseTypeColSetOptionsQuery, caseTypeSetOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.getInstance().userShareCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: UserShareCasePolicy) => {
    return await AbacApi.getInstance().userShareCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: UserShareCasePolicy) => {
    return (await AbacApi.getInstance().userShareCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.getInstance().userShareCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: UserShareCasePolicy) => {
    return nameFactory.getName(item);
  }, [nameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      user_id: string().uuid4().required().max(100),
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
        name: 'user_id',
        label: t`User`,
        options: userOptionsQuery.options,
        loading: userOptionsQuery.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'data_collection_id',
        label: t`Data collection`,
        options: dataCollectionOptionsQuery.options,
        loading: dataCollectionOptionsQuery.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'from_data_collection_id',
        label: t`From data collection`,
        options: dataCollectionOptionsQuery.options,
        loading: dataCollectionOptionsQuery.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_set_id',
        label: t`Case type set`,
        options: caseTypeSetOptionsQuery.options,
        loading: caseTypeSetOptionsQuery.isLoading,
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
  }, [caseTypeSetOptionsQuery.isLoading, caseTypeSetOptionsQuery.options, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, userOptionsQuery.isLoading, userOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<UserShareCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<UserShareCasePolicy>({ id: 'user_id', name: t`User`, options: userOptionsQuery.options }),
      TableUtil.createOptionsColumn<UserShareCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<UserShareCasePolicy>({ id: 'from_data_collection_id', name: t`From collection`, options: dataCollectionOptionsQuery.options }),
      TableUtil.createOptionsColumn<UserShareCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptionsQuery.options }),

      TableUtil.createBooleanColumn<UserShareCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<UserShareCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<UserShareCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<UserShareCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),

      TableUtil.createBooleanColumn<UserShareCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [caseTypeSetOptionsQuery.options, dataCollectionOptionsQuery.options, userOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, UserShareCasePolicy>
      createOne={createOne}
      crudCommandType={CommandName.UserShareCasePolicyCrudCommand}
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
