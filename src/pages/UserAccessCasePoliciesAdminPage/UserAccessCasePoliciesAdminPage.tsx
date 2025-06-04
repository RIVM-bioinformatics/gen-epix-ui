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

import type { UserAccessCasePolicy } from '../../api';
import {
  AbacApi,
  CommandName,
} from '../../api';
import { useCaseTypeColSetOptions } from '../../dataHooks/useCaseTypeColSets';
import { useCaseTypeSetOptions } from '../../dataHooks/useCaseTypeSets';
import { useDataCollectionOptions } from '../../dataHooks/useDataCollections';
import { useUserOptions } from '../../dataHooks/useUsers';
import { useUserCasePolicyNameFactory } from '../../hooks/useUserCasePolicyNameFactory';
import type { Loadable } from '../../models/dataHooks';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<
  UserAccessCasePolicy,
  'user_id' |
  'data_collection_id' |
  'case_type_set_id' |
  'read_case_type_col_set_id' |
  'write_case_type_col_set_id' |
  'add_case' |
  'remove_case' |
  'add_case_set' |
  'remove_case_set' |
  'read_case_set' |
  'write_case_set' |
  'is_active'
>;

export const UserAccessCasePoliciesAdminPage = () => {
  const [t] = useTranslation();
  const userOptions = useUserOptions();
  const dataCollectionOptions = useDataCollectionOptions();
  const caseTypeColSetOptions = useCaseTypeColSetOptions();
  const caseTypeSetOptions = useCaseTypeSetOptions();

  const nameFactory = useUserCasePolicyNameFactory();

  const loadables = useMemo<Loadable[]>(() => [nameFactory, userOptions, dataCollectionOptions, caseTypeColSetOptions, caseTypeSetOptions], [nameFactory, caseTypeSetOptions, caseTypeColSetOptions, dataCollectionOptions, userOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.getInstance().userAccessCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: UserAccessCasePolicy) => {
    return await AbacApi.getInstance().userAccessCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: UserAccessCasePolicy) => {
    return (await AbacApi.getInstance().userAccessCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.getInstance().userAccessCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: UserAccessCasePolicy) => {
    return nameFactory.getName(item);
  }, [nameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      user_id: string().uuid4().required().max(100),
      data_collection_id: string().uuid4().required().max(100),
      case_type_set_id: string().uuid4().required().max(100),
      read_case_type_col_set_id: string().uuid4().required().max(100),
      write_case_type_col_set_id: string().uuid4().nullable().notRequired().max(100),
      add_case: boolean().required(),
      remove_case: boolean().required(),
      add_case_set: boolean().required(),
      remove_case_set: boolean().required(),
      read_case_set: boolean().required(),
      write_case_set: boolean().required(),
      is_active: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'user_id',
        label: t`User`,
        options: userOptions.options,
        loading: userOptions.isLoading,
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
        name: 'case_type_set_id',
        label: t`Case type set`,
        options: caseTypeSetOptions.options,
        loading: caseTypeSetOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'read_case_type_col_set_id',
        label: t`Read column set`,
        options: caseTypeColSetOptions.options,
        loading: caseTypeColSetOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'write_case_type_col_set_id',
        label: t`Write column set`,
        options: caseTypeColSetOptions.options,
        loading: caseTypeColSetOptions.isLoading,
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
        name: 'read_case_set',
        label: t`Read case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'write_case_set',
        label: t`Write case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
      },
    ];
  }, [caseTypeColSetOptions.isLoading, caseTypeColSetOptions.options, caseTypeSetOptions.isLoading, caseTypeSetOptions.options, dataCollectionOptions.isLoading, dataCollectionOptions.options, userOptions.isLoading, userOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<UserAccessCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<UserAccessCasePolicy>({ id: 'user_id', name: t`User`, options: userOptions.options }),
      TableUtil.createOptionsColumn<UserAccessCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptions.options }),
      TableUtil.createOptionsColumn<UserAccessCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptions.options }),
      TableUtil.createOptionsColumn<UserAccessCasePolicy>({ id: 'read_case_type_col_set_id', name: t`Read column set`, options: caseTypeColSetOptions.options }),
      TableUtil.createOptionsColumn<UserAccessCasePolicy>({ id: 'write_case_type_col_set_id', name: t`Write column set`, options: caseTypeColSetOptions.options }),

      TableUtil.createBooleanColumn<UserAccessCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<UserAccessCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<UserAccessCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<UserAccessCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),
      TableUtil.createBooleanColumn<UserAccessCasePolicy>({ id: 'read_case_set', name: t`Read case set` }),
      TableUtil.createBooleanColumn<UserAccessCasePolicy>({ id: 'write_case_set', name: t`Write case set` }),

      TableUtil.createBooleanColumn<UserAccessCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [caseTypeColSetOptions.options, caseTypeSetOptions.options, dataCollectionOptions.options, userOptions.options, t]);

  return (
    <CrudPage<FormFields, UserAccessCasePolicy>
      createOne={createOne}
      crudCommandType={CommandName.UserAccessCasePolicyCrudCommand}
      defaultSortByField={'user_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.USER_ACCESS_CASE_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('UserAccessCasePoliciesAdminPage')}
      title={t`User access case policies`}
      updateOne={updateOne}
    />
  );
};
