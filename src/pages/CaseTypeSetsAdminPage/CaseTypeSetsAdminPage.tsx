import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  number,
  object,
  string,
} from 'yup';
import omit from 'lodash/omit';

import type {
  CaseTypeSet,
  ApiPermission,
} from '../../api';
import {
  CaseApi,
  CommandName,
  PermissionType,
} from '../../api';
import { useCaseTypeOptionsQuery } from '../../dataHooks/useCaseTypesQuery';
import { useCaseTypeSetCategoryOptionsQuery } from '../../dataHooks/useCaseTypeSetCategoriesQuery';
import { useCaseTypeSetMembersQuery } from '../../dataHooks/useCaseTypeSetMembersQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

interface TableData extends CaseTypeSet {
  caseTypeIds?: string[];
}

type FormFields = Pick<TableData, 'name' | 'case_type_set_category_id' | 'caseTypeIds' | 'rank' | 'description'>;

export const CaseTypeSetsAdminPage = () => {
  const [t] = useTranslation();
  const caseTypeSetCategoryOptionsQuery = useCaseTypeSetCategoryOptionsQuery();
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();

  const loadables = useArray([caseTypeOptionsQuery, caseTypeSetCategoryOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal): Promise<CaseTypeSet[]> => {
    const caseTypesSets = (await CaseApi.getInstance().caseTypeSetsGetAll({ signal }))?.data;
    return caseTypesSets;
  }, []);

  const deleteOne = useCallback(async (item: CaseTypeSet) => {
    return await CaseApi.getInstance().caseTypeSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeSet) => {
    await CaseApi.getInstance().caseTypeSetsPutCaseTypes(item.id, {
      case_type_set_members: variables.caseTypeIds.map(case_type_id => ({
        case_type_id,
        case_type_set_id: item.id,
      })),
    });
    return (await CaseApi.getInstance().caseTypeSetsPutOne(item.id, omit({ id: item.id, ...variables }, ['caseTypeIds']))).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseApi.getInstance().caseTypeSetsPostOne(omit(variables, ['caseTypeIds']))).data;
    await CaseApi.getInstance().caseTypeSetsPutCaseTypes(resultItem.id, {
      case_type_set_members: variables.caseTypeIds.map(case_type_id => ({
        case_type_id,
        case_type_set_id: resultItem.id,
      })),
    });
    return resultItem;
  }, []);

  const getName = useCallback((item: CaseTypeSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      rank: number().required().min(0),
      case_type_set_category_id: string().uuid4().required(),
      caseTypeIds: array(),
      description: string().freeFormText().required().max(1000),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_set_category_id',
        label: t`Category`,
        options: caseTypeSetCategoryOptionsQuery.options,
        loading: caseTypeSetCategoryOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
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
        name: 'caseTypeIds',
        label: t`Case types`,
        options: caseTypeOptionsQuery.options,
        loading: caseTypeOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options, caseTypeSetCategoryOptionsQuery.isLoading, caseTypeSetCategoryOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createOptionsColumn<TableData>({ id: 'case_type_set_category_id', name: t`Category`, options: caseTypeSetCategoryOptionsQuery.options }),
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<TableData>({ id: 'rank', name: t`Rank` }),
      {
        id: 'caseTypeCount',
        type: 'number',
        headerName: t`Case type count`,
        valueGetter: (item) => item.row.caseTypeIds.length,
        displayValueGetter: (item) => `${item.row.caseTypeIds.length} / ${caseTypeOptionsQuery.options.length}`,
        widthFlex: 0.5,
        textAlign: 'right',
        isInitiallyVisible: true,
      },
    ];
  }, [caseTypeOptionsQuery.options.length, caseTypeSetCategoryOptionsQuery.options, t]);

  const extraCreateOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.CaseTypeSetCaseTypeUpdateAssociationCommand, permission_type: PermissionType.EXECUTE },
  ], []);
  const extraDeleteOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.CaseTypeSetCaseTypeUpdateAssociationCommand, permission_type: PermissionType.EXECUTE },
  ], []);
  const extraUpdateOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.CaseTypeSetCaseTypeUpdateAssociationCommand, permission_type: PermissionType.EXECUTE },
  ], []);


  const convertToTableData = useCallback((items: CaseTypeSet[]) => {
    if (!items || !caseTypeSetMembersQuery.data) {
      return [];
    }
    return items.map<TableData>((item) => {
      const caseTypeIds = caseTypeSetMembersQuery.data.filter(member => member.case_type_set_id === item.id).map(member => member.case_type_id);
      return {
        ...item,
        caseTypeIds,
      } satisfies TableData;
    });
  }, [caseTypeSetMembersQuery.data]);

  const associationQueryKeys = useMemo(() => [
    [QUERY_KEY.CASE_TYPE_SET_MEMBERS],
  ], []);

  return (
    <CrudPage<FormFields, CaseTypeSet, TableData>
      associationQueryKeys={associationQueryKeys}
      convertToTableData={convertToTableData}
      createOne={createOne}
      crudCommandType={CommandName.CaseTypeSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      extraCreateOnePermissions={extraCreateOnePermissions}
      extraDeleteOnePermissions={extraDeleteOnePermissions}
      extraUpdateOnePermissions={extraUpdateOnePermissions}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPE_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeSetsAdminPage')}
      title={t`Case types sets`}
      updateOne={updateOne}
    />
  );
};
