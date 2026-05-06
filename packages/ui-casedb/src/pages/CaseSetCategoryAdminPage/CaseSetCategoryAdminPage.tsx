import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type { CaseDbCaseSetCategory } from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
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
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


type FormFields = OmitWithMetaData<CaseDbCaseSetCategory>;

export const CaseSetCategoryAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().caseSetStatusesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbCaseSetCategory) => {
    return await CaseDbCaseApi.getInstance().caseSetStatusesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbCaseSetCategory) => {
    return (await CaseDbCaseApi.getInstance().caseSetStatusesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbCaseApi.getInstance().caseSetStatusesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      description: SchemaUtil.description,
      name: SchemaUtil.name,
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
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseDbCaseSetCategory>[] => {
    return [
      TableUtil.createTextColumn<CaseDbCaseSetCategory>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<CaseDbCaseSetCategory>({ id: 'rank', name: t`Rank` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbCaseSetCategory>
      createItemDialogTitle={t`Create new case set category`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.CaseSetCategoryCrudCommand}
      defaultSortByField={'rank'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.CASE_SET_CATEGORIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseSetCategoryAdminPage')}
      title={t`Case set categories`}
      updateOne={updateOne}
    />
  );
};
