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
  ApiPermission,
  CaseTypeSet,
} from '@gen-epix/api-casedb';
import {
  CaseApi,
  CommandName,
  PermissionType,
} from '@gen-epix/api-casedb';

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
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<TableData, 'case_type_set_category'>;

interface TableData extends CaseTypeSet {
  caseTypeIds?: string[];
}

export const CaseTypeSetsAdminPage = () => {
  const { t } = useTranslation();
  const caseTypeSetCategoryOptionsQuery = useCaseTypeSetCategoryOptionsQuery();
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();

  const loadables = useArray([caseTypeOptionsQuery, caseTypeSetCategoryOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal): Promise<CaseTypeSet[]> => {
    const caseTypesSets = (await CaseApi.instance.caseTypeSetsGetAll({ signal }))?.data;
    return caseTypesSets;
  }, []);

  const deleteOne = useCallback(async (item: CaseTypeSet) => {
    return await CaseApi.instance.caseTypeSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeSet) => {
    await CaseApi.instance.caseTypeSetsPutCaseTypes(item.id, {
      case_type_set_members: variables.caseTypeIds.map(case_type_id => ({
        case_type_id,
        case_type_set_id: item.id,
      })),
    });
    return (await CaseApi.instance.caseTypeSetsPutOne(item.id, omit({ id: item.id, ...variables }, ['caseTypeIds']))).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseApi.instance.caseTypeSetsPostOne(omit(variables, ['caseTypeIds']))).data;
    await CaseApi.instance.caseTypeSetsPutCaseTypes(resultItem.id, {
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
      case_type_set_category_id: string().uuid4().required(),
      caseTypeIds: array(),
      description: SchemaUtil.description,
      name: SchemaUtil.name,
      rank: SchemaUtil.rank,
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Category`,
        loading: caseTypeSetCategoryOptionsQuery.isLoading,
        name: 'case_type_set_category_id',
        options: caseTypeSetCategoryOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Rank`,
        name: 'rank',
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
        label: t`Case types`,
        loading: caseTypeOptionsQuery.isLoading,
        name: 'caseTypeIds',
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options, caseTypeSetCategoryOptionsQuery.isLoading, caseTypeSetCategoryOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createOptionsColumn<TableData>({ id: 'case_type_set_category_id', name: t`Category`, options: caseTypeSetCategoryOptionsQuery.options }),
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name` }),
      TableUtil.createNumberColumn<TableData>({ id: 'rank', name: t`Rank` }),
      {
        displayValueGetter: (item) => `${item.row.caseTypeIds.length} / ${caseTypeOptionsQuery.options.length}`,
        headerName: t`Case type count`,
        id: 'caseTypeCount',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (item) => item.row.caseTypeIds.length,
        widthFlex: 0.5,
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
      createItemDialogTitle={t`Create new case type set`}
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
