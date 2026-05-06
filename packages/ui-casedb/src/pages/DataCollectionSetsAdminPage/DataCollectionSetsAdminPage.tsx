import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';
import type {
  CaseDbApiPermission,
  CaseDbDataCollectionSet,
  CaseDbDataCollectionSetMember,
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
  useArray,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';
import { useDataCollectionSetMembersQuery } from '../../dataHooks/useDataCollectionSetMembersQuery';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';


type FormFields = OmitWithMetaData<TableData>;

type TableData = { dataCollectionIds: string[] } & CaseDbDataCollectionSet;

export const DataCollectionSetsAdminPage = () => {
  const { t } = useTranslation();

  const dataCollectionSetMembersQuery = useDataCollectionSetMembersQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();

  const loadables = useArray([dataCollectionSetMembersQuery, dataCollectionOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOrganizationApi.getInstance().dataCollectionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbDataCollectionSet) => {
    return await CaseDbOrganizationApi.getInstance().dataCollectionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbDataCollectionSet) => {
    await CaseDbOrganizationApi.getInstance().dataCollectionSetsPutDataCollections(item.id, {
      data_collection_set_members: variables.dataCollectionIds.map<CaseDbDataCollectionSetMember>(data_collection_id => ({
        data_collection_id,
        data_collection_set_id: item.id,
      })),
    });
    return (await CaseDbOrganizationApi.getInstance().dataCollectionSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseDbOrganizationApi.getInstance().dataCollectionSetsPostOne(variables)).data;
    await CaseDbOrganizationApi.getInstance().dataCollectionSetsPutDataCollections(resultItem.id, {
      data_collection_set_members: variables.dataCollectionIds.map<CaseDbDataCollectionSetMember>(data_collection_id => ({
        data_collection_id,
        data_collection_set_id: resultItem.id,
      })),
    });
    return resultItem;
  }, []);

  const getName = useCallback((item: CaseDbDataCollectionSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      dataCollectionIds: array().of(string().uuid4()).min(1).required(),
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
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        label: t`Columns`,
        loading: dataCollectionOptionsQuery.isLoading,
        name: 'dataCollectionIds',
        options: dataCollectionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ advancedSort: true, id: 'name', name: t`Name` }),
      {
        displayValueGetter: (item) => `${item.row.dataCollectionIds.length} / ${dataCollectionOptionsQuery.options.length}`,
        headerName: t`Data collections`,
        id: 'numDataCollections',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (item) => item.row.dataCollectionIds.length,
        widthFlex: 0.5,
      },
    ];
  }, [dataCollectionOptionsQuery.options.length, t]);

  const convertToTableData = useCallback((items: CaseDbDataCollectionSet[]) => {
    if (!items || !dataCollectionSetMembersQuery.data) {
      return [];
    }
    return items.map<TableData>((item) => {
      const dataCollectionIds = dataCollectionSetMembersQuery.data.filter(member => member.data_collection_set_id === item.id).map(member => member.data_collection_id);
      return {
        ...item,
        dataCollectionIds,
      } satisfies TableData;
    });
  }, [dataCollectionSetMembersQuery.data]);

  return (
    <CrudPage<FormFields, CaseDbDataCollectionSet, TableData, CASEDB_QUERY_KEY, CaseDbApiPermission>
      convertToTableData={convertToTableData}
      createItemDialogTitle={t`Create new data collection set`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.DataCollectionSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.DATA_COLLECTION_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionSetsAdminPage')}
      title={t`Data collection sets`}
      updateOne={updateOne}
    />
  );
};
