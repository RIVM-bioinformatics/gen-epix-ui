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
  ColSet,
  ColSetMember,
  ApiPermission,
} from '../../api';
import {
  CaseApi,
  CommandName,
  PermissionType,
} from '../../api';
import { useColOptionsQuery } from '../../dataHooks/useColsQuery';
import { useColSetMembersQuery } from '../../dataHooks/useColSetMembersQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type TableData = ColSet & { colIds: string[] };

type FormFields = Pick<TableData, 'name' | 'description' | 'colIds'>;

export const ColSetsAdminPage = () => {
  const { t } = useTranslation();

  const colOptionsQuery = useColOptionsQuery();
  const colSetMembersQuery = useColSetMembersQuery();

  const loadables = useArray([colOptionsQuery, colSetMembersQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.colSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: ColSet) => {
    return await CaseApi.instance.colSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: ColSet) => {
    await CaseApi.instance.colSetsPutCols(item.id, {
      col_set_members: variables.colIds.map<ColSetMember>(col_id => ({
        col_id,
        col_set_id: item.id,
      })),
    });

    return (await CaseApi.instance.colSetsPutOne(item.id, omit({ id: item.id, ...variables }, ['colIds']))).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseApi.instance.colSetsPostOne(omit(variables, ['colIds']))).data;
    await CaseApi.instance.colSetsPutCols(resultItem.id, {
      col_set_members: variables.colIds.map<ColSetMember>(col_id => ({
        col_id,
        col_set_id: resultItem.id,
      })),
    });

    return resultItem;
  }, []);

  const getName = useCallback((item: ColSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().nullable(),
      colIds: array().of(string().uuid4()).min(1).required(),
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
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        name: 'colIds',
        label: t`Columns`,
        options: colOptionsQuery.options,
        loading: colOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [colOptionsQuery.isLoading, colOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name` }),
      {
        type: 'number',
        id: 'numCols',
        textAlign: 'right',
        valueGetter: (item) => item.row.colIds.length,
        displayValueGetter: (item) => `${item.row.colIds.length} / ${colOptionsQuery.options.length}`,
        headerName: t`Column count`,
        widthFlex: 0.5,
        isInitiallyVisible: true,
      },
    ];
  }, [colOptionsQuery.options.length, t]);

  const extraPermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.ColSetColUpdateAssociationCommand, permission_type: PermissionType.EXECUTE },
  ], []);

  const convertToTableData = useCallback((items: ColSet[]) => {
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
    [QUERY_KEY.COL_SET_MEMBERS],
  ], []);

  return (
    <CrudPage<FormFields, ColSet, TableData>
      associationQueryKeys={associationQueryKeys}
      convertToTableData={convertToTableData}
      createItemDialogTitle={t`Create new column set`}
      createOne={createOne}
      crudCommandType={CommandName.ColSetCrudCommand}
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
      resourceQueryKeyBase={QUERY_KEY.COL_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ColSetsAdminPage')}
      title={t`Column sets`}
      updateOne={updateOne}
    />
  );
};
