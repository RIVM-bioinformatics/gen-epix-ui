import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
  string,
} from 'yup';

import type { CaseTypeSetCategory } from '../../api';
import {
  CaseApi,
  CaseTypeSetCategoryPurpose,
  CommandName,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { NumberUtil } from '../../utils/NumberUtil';
import { useCaseTypeSetCategoryPurposeOptionsQuery } from '../../dataHooks/useCaseTypeSetCategoryPurposeQuery';
import { useArray } from '../../hooks/useArray';
import type { OmitWithMetaData } from '../../models/data';

type FormFields = OmitWithMetaData<CaseTypeSetCategory>;

export const CaseTypeSetCategoriesAdminPage = () => {
  const { t } = useTranslation();

  const caseTypeSetCategoryPurposeOptionsQuery = useCaseTypeSetCategoryPurposeOptionsQuery();

  const loadables = useArray([caseTypeSetCategoryPurposeOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.caseTypeSetCategoriesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseTypeSetCategory) => {
    return await CaseApi.instance.caseTypeSetCategoriesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeSetCategory) => {
    return (await CaseApi.instance.caseTypeSetCategoriesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.caseTypeSetCategoriesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseTypeSetCategory) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      rank: NumberUtil.yup.required().min(0).integer(),
      description: string().freeFormText().required().max(1000),
      purpose: mixed<CaseTypeSetCategoryPurpose>().required().oneOf(Object.values(CaseTypeSetCategoryPurpose)),
    });
  }, []);


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'purpose',
        label: t`Purpose`,
        options: caseTypeSetCategoryPurposeOptionsQuery.options,
        loading: caseTypeSetCategoryPurposeOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseTypeSetCategoryPurposeOptionsQuery.isLoading, caseTypeSetCategoryPurposeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseTypeSetCategory>[] => {
    return [
      TableUtil.createTextColumn<CaseTypeSetCategory>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<CaseTypeSetCategory>({ id: 'rank', name: t`Rank` }),
      TableUtil.createOptionsColumn<CaseTypeSetCategory>({ id: 'purpose', name: t`Purpose`, options: caseTypeSetCategoryPurposeOptionsQuery.options }),
    ];
  }, [caseTypeSetCategoryPurposeOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, CaseTypeSetCategory>
      createOne={createOne}
      crudCommandType={CommandName.CaseTypeSetCategoryCrudCommand}
      createItemDialogTitle={t`Create new case type set category`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPE_SET_CATEGORIES}
      loadables={loadables}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeSetCategoriesAdminPage')}
      title={t`Case type set categories`}
      updateOne={updateOne}
    />
  );
};
