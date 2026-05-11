import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type {
  CaseDbApiPermission,
  CaseDbCaseSetStatus,
} from '@gen-epix/api-casedb';
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


type FormFields = OmitWithMetaData<CaseDbCaseSetStatus>;

export const CaseSetStatusAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().caseSetStatusesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbCaseSetStatus) => {
    return await CaseDbCaseApi.getInstance().caseSetStatusesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbCaseSetStatus) => {
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

  const tableColumns = useMemo((): TableColumn<CaseDbCaseSetStatus>[] => {
    return [
      TableUtil.createTextColumn<CaseDbCaseSetStatus>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<CaseDbCaseSetStatus>({ id: 'rank', name: t`Rank` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbCaseSetStatus, CaseDbCaseSetStatus, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new case set status`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.CaseSetStatusCrudCommand}
      defaultSortByField={'rank'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.CASE_SET_STATUSES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseSetStatusAdminPage')}
      title={t`Case set statuses`}
      updateOne={updateOne}
    />
  );
};
