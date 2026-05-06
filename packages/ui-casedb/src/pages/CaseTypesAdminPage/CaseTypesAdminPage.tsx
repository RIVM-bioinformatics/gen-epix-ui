import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import type {
  CaseDbApiPermission,
  CaseDbCaseType,
  CaseDbCaseTypeProps,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type {
  CrudPageSubPage,
  FormFieldDefinition,
  OmitWithMetaData,
  TableColumn,
} from '@gen-epix/ui';
import {
  AuthorizationManager,
  CrudPage,
  FORM_FIELD_DEFINITION_TYPE,
  SchemaUtil,
  TableUtil,
  TestIdUtil,
  useArray,
} from '@gen-epix/ui';

import { useDiseaseOptionsQuery } from '../../dataHooks/useDiseasesQuery';
import { useEtiologicalAgentOptionsQuery } from '../../dataHooks/useEtiologicalAgentsQuery';
import { CASEDB_QUERY_KEY } from '../../data/query';

type FormFields = CaseDbCaseTypeProps & OmitWithMetaData<CaseDbCaseType, 'disease' | 'etiological_agent' | 'props'>;

export const CaseTypesAdminPage = () => {
  const { t } = useTranslation();
  const diseaseOptionsQuery = useDiseaseOptionsQuery();
  const etiologicalAgentOptionsQuery = useEtiologicalAgentOptionsQuery();

  const loadables = useArray([diseaseOptionsQuery, etiologicalAgentOptionsQuery]);

  const getCaseTypeFromVariables = useCallback((variables: FormFields, id?: string) => {
    const itemForUpdate: CaseDbCaseType = {
      ...omit(variables, ['create_max_n_cases', 'delete_max_n_cases', 'read_max_n_cases', 'read_max_tree_size', 'update_max_n_cases']),
      props: {
        ...pick(variables, ['create_max_n_cases', 'delete_max_n_cases', 'read_max_n_cases', 'read_max_tree_size', 'update_max_n_cases']),
      },
    };
    if (id) {
      itemForUpdate.id = id;
    }
    return itemForUpdate;
  }, []);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().caseTypesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbCaseType) => {
    return await CaseDbCaseApi.getInstance().caseTypesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbCaseType) => {
    return (await CaseDbCaseApi.getInstance().caseTypesPutOne(item.id, getCaseTypeFromVariables(variables, item.id))).data;
  }, [getCaseTypeFromVariables]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbCaseApi.getInstance().caseTypesPostOne(getCaseTypeFromVariables(variables))).data;
  }, [getCaseTypeFromVariables]);

  const getName = useCallback((item: CaseDbCaseType) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      create_max_n_cases: SchemaUtil.number.min(0),
      delete_max_n_cases: SchemaUtil.number.min(0),
      description: SchemaUtil.description,
      disease_id: string().uuid4().nullable().test(function(value: string) {
        const { etiological_agent_id } = this.parent as FormFields;
        if (value !== null || !!etiological_agent_id) {
          return true;
        }
        return this.createError({
          message: t`Disease is required when no etiological agent is selected`,
          path: 'disease_id',
        });
      }),
      etiological_agent_id: string().uuid4().nullable().test(function(value: string) {
        const { disease_id } = this.parent as FormFields;
        if (value !== null || !!disease_id) {
          return true;
        }
        return this.createError({
          message: t`Etiological agent is required when no disease is selected`,
          path: 'etiological_agent_id',
        });
      }),
      name: SchemaUtil.name,
      read_max_n_cases: SchemaUtil.number.min(0),
      read_max_tree_size: SchemaUtil.number.min(0),
      update_max_n_cases: SchemaUtil.number.min(0),
    });
  }, [t]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Disease`,
        loading: diseaseOptionsQuery.isLoading,
        name: 'disease_id',
        options: diseaseOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Etiological agent`,
        loading: etiologicalAgentOptionsQuery.isLoading,
        name: 'etiological_agent_id',
        options: etiologicalAgentOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Read max number of cases`,
        name: 'read_max_n_cases',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Create max number of cases`,
        name: 'create_max_n_cases',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Update max number of cases`,
        name: 'update_max_n_cases',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Delete max number of cases`,
        name: 'delete_max_n_cases',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Read max tree size`,
        name: 'read_max_tree_size',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [etiologicalAgentOptionsQuery.isLoading, etiologicalAgentOptionsQuery.options, diseaseOptionsQuery, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbCaseType>[] => {
    return [
      TableUtil.createTextColumn<CaseDbCaseType>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<CaseDbCaseType>({ id: 'disease_id', name: t`Disease`, options: diseaseOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseDbCaseType>({ id: 'etiological_agent_id', name: t`Etiological agent`, options: etiologicalAgentOptionsQuery.options }),
      {
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        headerName: t`Read max number of cases`,
        id: 'read_max_n_cases',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (params) => params.row.props?.read_max_n_cases,
        widthFlex: 1,
      },
      {
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        headerName: t`Create max number of cases`,
        id: 'create_max_n_cases',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (params) => params.row.props?.create_max_n_cases,
        widthFlex: 1,
      },
      {
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        headerName: t`Update max number of cases`,
        id: 'update_max_n_cases',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (params) => params.row.props?.update_max_n_cases,
        widthFlex: 1,
      },
      {
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        headerName: t`Delete max number of cases`,
        id: 'delete_max_n_cases',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (params) => params.row.props?.delete_max_n_cases,
        widthFlex: 1,
      },
      {
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        headerName: t`Read max tree size`,
        id: 'read_max_tree_size',
        isInitiallyVisible: true,
        textAlign: 'right',
        type: 'number',
        valueGetter: (params) => params.row.props?.read_max_tree_size,
        widthFlex: 1,
      },
    ];
  }, [etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.options, t]);

  const subPages = useMemo<CrudPageSubPage<CaseDbCaseType>[]>(() => {
    if (!AuthorizationManager.getInstance().doesUserHavePermission<CaseDbApiPermission>([
      { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        getPathName: (item: CaseDbCaseType) => `/management/case-types/${item.id}/dimensions`,
        label: t`Manage dimensions`,
      } satisfies CrudPageSubPage<CaseDbCaseType>,
    ];
  }, [t]);

  const getFormValuesFromItem = useCallback((item: CaseDbCaseType): Partial<FormFields> => {
    if (!item) {
      return {};
    }
    return {
      create_max_n_cases: item.props?.create_max_n_cases,
      delete_max_n_cases: item.props?.delete_max_n_cases,
      description: item.description,
      disease_id: item.disease_id,
      etiological_agent_id: item.etiological_agent_id,
      name: item.name,
      read_max_n_cases: item.props?.read_max_n_cases,
      read_max_tree_size: item.props?.read_max_tree_size,
      update_max_n_cases: item.props?.update_max_n_cases,
    };
  }, []);

  const getIntermediateItem = useCallback((variables: FormFields, currentItem: CaseDbCaseType): CaseDbCaseType => {
    return {
      ...currentItem,
      description: variables.description,
      disease_id: variables.disease_id,
      etiological_agent_id: variables.etiological_agent_id,
      name: variables.name,
      props: {
        create_max_n_cases: variables.create_max_n_cases,
        delete_max_n_cases: variables.delete_max_n_cases,
        read_max_n_cases: variables.read_max_n_cases,
        read_max_tree_size: variables.read_max_tree_size,
        update_max_n_cases: variables.update_max_n_cases,
      },
    };
  }, []);

  return (
    <CrudPage<FormFields, CaseDbCaseType>
      createItemDialogTitle={t`Create new case type`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.CaseTypeCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getFormValuesFromItem={getFormValuesFromItem}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getIntermediateItem}
      loadables={loadables}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.CASE_TYPES}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypesAdminPage')}
      title={t`Case types`}
      updateOne={updateOne}
    />
  );
};
