import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  number,
  object,
  string,
} from 'yup';

import type { CaseTypeSetCategory } from '../../api';
import {
  CaseApi,
  CommandName,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<CaseTypeSetCategory, 'name' | 'rank' | 'description'>;

export const CaseTypeSetCategoriesAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.getInstance().caseTypeSetCategoriesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseTypeSetCategory) => {
    return await CaseApi.getInstance().caseTypeSetCategoriesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeSetCategory) => {
    return (await CaseApi.getInstance().caseTypeSetCategoriesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.getInstance().caseTypeSetCategoriesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseTypeSetCategory) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      rank: number().required().min(0),
      description: string().freeFormText().required().max(1000),
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
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseTypeSetCategory>[] => {
    return [
      TableUtil.createTextColumn<CaseTypeSetCategory>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<CaseTypeSetCategory>({ id: 'rank', name: t`Rank` }),
      TableUtil.createTextColumn<CaseTypeSetCategory>({ id: 'description', name: t`Description` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseTypeSetCategory>
      createOne={createOne}
      crudCommandType={CommandName.CaseTypeSetCategoryCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPE_SET_CATEGORIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeSetCategoriesAdminPage')}
      title={t`Case type set categories`}
      updateOne={updateOne}
    />
  );
};
