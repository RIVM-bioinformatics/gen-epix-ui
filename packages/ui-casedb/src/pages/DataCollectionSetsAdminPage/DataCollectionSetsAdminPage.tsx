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
  CaseDbDataCollectionSet,
  CaseDbDataCollectionSetMember,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOrganizationApi,
} from '@gen-epix/api-casedb';

import { CrudPage } from '../CrudPage';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useDataCollectionSetMembersQuery } from '../../dataHooks/useDataCollectionSetMembersQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<TableData>;

type TableData = { dataCollectionIds: string[] } & CaseDbDataCollectionSet;

export const DataCollectionSetsAdminPage = () => {
  const { t } = useTranslation();

  const dataCollectionSetMembersQuery = useDataCollectionSetMembersQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();

  const loadables = useArray([dataCollectionSetMembersQuery, dataCollectionOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOrganizationApi.instance.dataCollectionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbDataCollectionSet) => {
    return await CaseDbOrganizationApi.instance.dataCollectionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbDataCollectionSet) => {
    await CaseDbOrganizationApi.instance.dataCollectionSetsPutDataCollections(item.id, {
      data_collection_set_members: variables.dataCollectionIds.map<CaseDbDataCollectionSetMember>(data_collection_id => ({
        data_collection_id,
        data_collection_set_id: item.id,
      })),
    });
    return (await CaseDbOrganizationApi.instance.dataCollectionSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseDbOrganizationApi.instance.dataCollectionSetsPostOne(variables)).data;
    await CaseDbOrganizationApi.instance.dataCollectionSetsPutDataCollections(resultItem.id, {
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
    <CrudPage<FormFields, CaseDbDataCollectionSet, TableData>
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
      resourceQueryKeyBase={QUERY_KEY.DATA_COLLECTION_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionSetsAdminPage')}
      title={t`Data collection sets`}
      updateOne={updateOne}
    />
  );
};
