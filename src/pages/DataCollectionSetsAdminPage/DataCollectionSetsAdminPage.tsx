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

import { CrudPage } from '../CrudPage';
import type {
  DataCollectionSet,
  DataCollectionSetMember,
} from '../../api';
import {
  OrganizationApi,
  CommandName,
} from '../../api';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useDataCollectionSetMembersQuery } from '../../dataHooks/useDataCollectionSetMembersQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';

type TableData = DataCollectionSet & { dataCollectionIds: string[] };

type FormFields = Pick<TableData, 'name' | 'description' | 'dataCollectionIds'>;

export const DataCollectionSetsAdminPage = () => {
  const [t] = useTranslation();

  const dataCollectionSetMembersQuery = useDataCollectionSetMembersQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();

  const loadables = useArray([dataCollectionSetMembersQuery, dataCollectionOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.getInstance().dataCollectionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: DataCollectionSet) => {
    return await OrganizationApi.getInstance().dataCollectionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: DataCollectionSet) => {
    await OrganizationApi.getInstance().dataCollectionSetsPutDataCollections(item.id, {
      data_collection_set_members: variables.dataCollectionIds.map<DataCollectionSetMember>(data_collection_id => ({
        data_collection_id,
        data_collection_set_id: item.id,
      })),
    });
    return (await OrganizationApi.getInstance().dataCollectionSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await OrganizationApi.getInstance().dataCollectionSetsPostOne(variables)).data;
    await OrganizationApi.getInstance().dataCollectionSetsPutDataCollections(resultItem.id, {
      data_collection_set_members: variables.dataCollectionIds.map<DataCollectionSetMember>(data_collection_id => ({
        data_collection_id,
        data_collection_set_id: resultItem.id,
      })),
    });
    return resultItem;
  }, []);

  const getName = useCallback((item: DataCollectionSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().required().max(1000),
      dataCollectionIds: array().of(string().uuid4()).min(1).required(),
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
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        name: 'description',
        label: t`Description`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        name: 'dataCollectionIds',
        label: t`Case type columns`,
        options: dataCollectionOptionsQuery.options,
        loading: dataCollectionOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name`, advancedSort: true }),
      {
        type: 'number',
        id: 'numDataCollections',
        textAlign: 'right',
        valueGetter: (item) => item.row.dataCollectionIds.length,
        displayValueGetter: (item) => `${item.row.dataCollectionIds.length} / ${dataCollectionOptionsQuery.options.length}`,
        headerName: t`Data collections`,
        widthFlex: 0.5,
        isInitiallyVisible: true,
      },
    ];
  }, [dataCollectionOptionsQuery.options.length, t]);

  const convertToTableData = useCallback((items: DataCollectionSet[]) => {
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
    <CrudPage<FormFields, DataCollectionSet, TableData>
      convertToTableData={convertToTableData}
      createOne={createOne}
      crudCommandType={CommandName.DataCollectionSetCrudCommand}
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
