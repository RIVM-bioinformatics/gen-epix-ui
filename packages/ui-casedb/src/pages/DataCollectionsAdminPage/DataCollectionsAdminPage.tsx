import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type {
  CaseDbApiPermission,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOrganizationApi,
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


type FormFields = OmitWithMetaData<CaseDbDataCollection>;

export const DataCollectionsAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOrganizationApi.getInstance().dataCollectionsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbDataCollection) => {
    return await CaseDbOrganizationApi.getInstance().dataCollectionsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbDataCollection) => {
    return (await CaseDbOrganizationApi.getInstance().dataCollectionsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOrganizationApi.getInstance().dataCollectionsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      description: SchemaUtil.description,
      name: SchemaUtil.name,
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
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseDbDataCollection>[] => {
    return [
      TableUtil.createTextColumn<CaseDbDataCollection>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbDataCollection, CaseDbDataCollection, CASEDB_QUERY_KEY, CaseDbApiPermission>
      createItemDialogTitle={t`Create new data collection`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.DataCollectionCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.DATA_COLLECTIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionsAdminPage')}
      title={t`Data collections`}
      updateOne={updateOne}
    />
  );
};
