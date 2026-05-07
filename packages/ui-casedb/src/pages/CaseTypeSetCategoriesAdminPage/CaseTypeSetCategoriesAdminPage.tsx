import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
} from 'yup';
import type {
  CaseDbApiPermission,
  CaseDbCaseTypeSetCategory,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbCaseTypeSetCategoryPurpose,
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
  SchemaUtil,
  TableUtil,
  TestIdUtil,
  useArray,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';
import { useCaseTypeSetCategoryPurposeOptionsQuery } from '../../dataHooks/useCaseTypeSetCategoryPurposeQuery';


type FormFields = OmitWithMetaData<CaseDbCaseTypeSetCategory>;

export const CaseTypeSetCategoriesAdminPage = () => {
  const { t } = useTranslation();

  const caseTypeSetCategoryPurposeOptionsQuery = useCaseTypeSetCategoryPurposeOptionsQuery();

  const loadables = useArray([caseTypeSetCategoryPurposeOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().caseTypeSetCategoriesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbCaseTypeSetCategory) => {
    return await CaseDbCaseApi.getInstance().caseTypeSetCategoriesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbCaseTypeSetCategory) => {
    return (await CaseDbCaseApi.getInstance().caseTypeSetCategoriesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbCaseApi.getInstance().caseTypeSetCategoriesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbCaseTypeSetCategory) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      description: SchemaUtil.description,
      name: SchemaUtil.name,
      purpose: mixed<CaseDbCaseTypeSetCategoryPurpose>().required().oneOf(Object.values(CaseDbCaseTypeSetCategoryPurpose)),
      rank: SchemaUtil.rank,
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
        label: t`Rank`,
        name: 'rank',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Purpose`,
        loading: caseTypeSetCategoryPurposeOptionsQuery.isLoading,
        name: 'purpose',
        options: caseTypeSetCategoryPurposeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseTypeSetCategoryPurposeOptionsQuery.isLoading, caseTypeSetCategoryPurposeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbCaseTypeSetCategory>[] => {
    return [
      TableUtil.createTextColumn<CaseDbCaseTypeSetCategory>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<CaseDbCaseTypeSetCategory>({ id: 'rank', name: t`Rank` }),
      TableUtil.createOptionsColumn<CaseDbCaseTypeSetCategory>({ id: 'purpose', name: t`Purpose`, options: caseTypeSetCategoryPurposeOptionsQuery.options }),
    ];
  }, [caseTypeSetCategoryPurposeOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, CaseDbCaseTypeSetCategory, CaseDbCaseTypeSetCategory, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new case type set category`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.CaseTypeSetCategoryCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.CASE_TYPE_SET_CATEGORIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeSetCategoriesAdminPage')}
      title={t`Case type set categories`}
      updateOne={updateOne}
    />
  );
};
