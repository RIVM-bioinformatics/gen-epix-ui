import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type { CaseSetStatus } from '@gen-epix/api-casedb';
import {
  CaseApi,
  CommandName,
} from '@gen-epix/api-casedb';

import { CrudPage } from '../CrudPage';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<CaseSetStatus>;

export const CaseSetStatusAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.caseSetStatusesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseSetStatus) => {
    return await CaseApi.instance.caseSetStatusesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseSetStatus) => {
    return (await CaseApi.instance.caseSetStatusesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.caseSetStatusesPostOne(variables)).data;
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

  const tableColumns = useMemo((): TableColumn<CaseSetStatus>[] => {
    return [
      TableUtil.createTextColumn<CaseSetStatus>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<CaseSetStatus>({ id: 'rank', name: t`Rank` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseSetStatus>
      createItemDialogTitle={t`Create new case set status`}
      createOne={createOne}
      crudCommandType={CommandName.CaseSetStatusCrudCommand}
      defaultSortByField={'rank'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.CASE_SET_STATUSES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseSetStatusAdminPage')}
      title={t`Case set statuses`}
      updateOne={updateOne}
    />
  );
};
