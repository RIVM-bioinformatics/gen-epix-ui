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
import omit from 'lodash/omit';
import type {
  CaseDbApiPermission,
  CaseDbColSet,
  CaseDbColSetMember,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbCommandName,
  CaseDbPermissionType,
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

import { useColOptionsQuery } from '../../dataHooks/useColsQuery';
import { useColSetMembersQuery } from '../../dataHooks/useColSetMembersQuery';
import { CASEDB_QUERY_KEY } from '../../data/query';

type FormFields = OmitWithMetaData<TableData>;

type TableData = { colIds: string[] } & CaseDbColSet;

export const ColSetsAdminPage = () => {
  const { t } = useTranslation();

  const colOptionsQuery = useColOptionsQuery();
  const colSetMembersQuery = useColSetMembersQuery();

  const loadables = useArray([colOptionsQuery, colSetMembersQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().colSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbColSet) => {
    return await CaseDbCaseApi.getInstance().colSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbColSet) => {
    await CaseDbCaseApi.getInstance().colSetsPutCols(item.id, {
      col_set_members: variables.colIds.map<CaseDbColSetMember>(col_id => ({
        col_id,
        col_set_id: item.id,
      })),
    });

    return (await CaseDbCaseApi.getInstance().colSetsPutOne(item.id, omit({ id: item.id, ...variables }, ['colIds']))).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseDbCaseApi.getInstance().colSetsPostOne(omit(variables, ['colIds']))).data;
    await CaseDbCaseApi.getInstance().colSetsPutCols(resultItem.id, {
      col_set_members: variables.colIds.map<CaseDbColSetMember>(col_id => ({
        col_id,
        col_set_id: resultItem.id,
      })),
    });

    return resultItem;
  }, []);

  const getName = useCallback((item: CaseDbColSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      colIds: array().of(string().uuid4()).min(1).required(),
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
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        label: t`Columns`,
        loading: colOptionsQuery.isLoading,
        name: 'colIds',
        options: colOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [colOptionsQuery.isLoading, colOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name` }),
      {
        displayValueGetter: (item) => `${item.row.colIds.length} / ${colOptionsQuery.options.length}`,
        headerName: t`Column count`,
        id: 'numCols',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (item) => item.row.colIds.length,
        widthFlex: 0.5,
      },
    ];
  }, [colOptionsQuery.options.length, t]);

  const extraPermissions = useMemo<CaseDbApiPermission[]>(() => [
    { command_name: CaseDbCommandName.ColSetColUpdateAssociationCommand, permission_type: CaseDbPermissionType.EXECUTE },
  ], []);

  const convertToTableData = useCallback((items: CaseDbColSet[]) => {
    if (!items || !colSetMembersQuery.data) {
      return [];
    }
    return items.map<TableData>((item) => {
      const colIds = colSetMembersQuery.data.filter(member => member.col_set_id === item.id).map(member => member.col_id);
      return {
        ...item,
        colIds,
      } satisfies TableData;
    });
  }, [colSetMembersQuery.data]);

  const associationQueryKeys = useMemo(() => [
    [CASEDB_QUERY_KEY.COL_SET_MEMBERS],
  ], []);

  return (
    <CrudPage<FormFields, CaseDbColSet, TableData, CASEDB_QUERY_KEY, CaseDbApiPermission>
      associationQueryKeys={associationQueryKeys}
      convertToTableData={convertToTableData}
      createItemDialogTitle={t`Create new column set`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.ColSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      extraCreateOnePermissions={extraPermissions}
      extraDeleteOnePermissions={extraPermissions}
      extraUpdateOnePermissions={extraPermissions}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.COL_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ColSetsAdminPage')}
      title={t`Column sets`}
      updateOne={updateOne}
    />
  );
};
