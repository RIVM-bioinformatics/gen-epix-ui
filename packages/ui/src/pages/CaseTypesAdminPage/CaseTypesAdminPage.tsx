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
  CaseType,
  CaseTypeProps,
} from '../../api';
import {
  CaseApi,
  CommandName,
  PermissionType,
} from '../../api';
import { useDiseaseOptionsQuery } from '../../dataHooks/useDiseasesQuery';
import { useEtiologicalAgentOptionsQuery } from '../../dataHooks/useEtiologicalAgentsQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { NumberUtil } from '../../utils/NumberUtil';

type FormFields = Pick<CaseType, 'name' | 'description' | 'etiological_agent_id' | 'disease_id'> & CaseTypeProps;

export const CaseTypesAdminPage = () => {
  const { t } = useTranslation();
  const diseaseOptionsQuery = useDiseaseOptionsQuery();
  const etiologicalAgentOptionsQuery = useEtiologicalAgentOptionsQuery();

  const loadables = useArray([diseaseOptionsQuery, etiologicalAgentOptionsQuery]);

  const getCaseTypeFromVariables = useCallback((variables: FormFields, id?: string) => {
    const itemForUpdate: CaseType = {
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
    return (await CaseApi.instance.caseTypesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseType) => {
    return await CaseApi.instance.caseTypesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseType) => {
    return (await CaseApi.instance.caseTypesPutOne(item.id, getCaseTypeFromVariables(variables, item.id))).data;
  }, [getCaseTypeFromVariables]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.caseTypesPostOne(getCaseTypeFromVariables(variables))).data;
  }, [getCaseTypeFromVariables]);

  const getName = useCallback((item: CaseType) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText(),
      create_max_n_cases: NumberUtil.yup.required().min(0),
      delete_max_n_cases: NumberUtil.yup.required().min(0),
      read_max_n_cases: NumberUtil.yup.required().min(0),
      read_max_tree_size: NumberUtil.yup.required().min(0),
      update_max_n_cases: NumberUtil.yup.required().min(0),
      etiological_agent_id: string().uuid4().nullable().test(function(value: string) {
        // eslint-disable-next-line react/no-this-in-sfc
        const { disease_id } = this.parent as FormFields;
        if (value !== null || !!disease_id) {
          return true;
        }
        // eslint-disable-next-line react/no-this-in-sfc
        return this.createError({
          message: t`Etiological agent is required when no disease is selected`,
          path: 'etiological_agent_id',
        });
      }),
      disease_id: string().uuid4().nullable().test(function(value: string) {
        // eslint-disable-next-line react/no-this-in-sfc
        const { etiological_agent_id } = this.parent as FormFields;
        if (value !== null || !!etiological_agent_id) {
          return true;
        }
        // eslint-disable-next-line react/no-this-in-sfc
        return this.createError({
          message: t`Disease is required when no etiological agent is selected`,
          path: 'disease_id',
        });
      }),
    });
  }, [t]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'disease_id',
        label: t`Disease`,
        options: diseaseOptionsQuery.options,
        loading: diseaseOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'etiological_agent_id',
        label: t`Etiological agent`,
        options: etiologicalAgentOptionsQuery.options,
        loading: etiologicalAgentOptionsQuery.isLoading,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        name: 'description',
        label: t`Description`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'read_max_n_cases',
        label: t`Read max number of cases`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'create_max_n_cases',
        label: t`Create max number of cases`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'update_max_n_cases',
        label: t`Update max number of cases`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'delete_max_n_cases',
        label: t`Delete max number of cases`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'read_max_tree_size',
        label: t`Read max tree size`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [etiologicalAgentOptionsQuery.isLoading, etiologicalAgentOptionsQuery.options, diseaseOptionsQuery, t]);

  const tableColumns = useMemo((): TableColumn<CaseType>[] => {
    return [
      TableUtil.createTextColumn<CaseType>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<CaseType>({ id: 'disease_id', name: t`Disease`, options: diseaseOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseType>({ id: 'etiological_agent_id', name: t`Etiological agent`, options: etiologicalAgentOptionsQuery.options }),
      {
        id: 'read_max_n_cases',
        headerName: t`Read max number of cases`,
        widthFlex: 1,
        type: 'number',
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        textAlign: 'right',
        isInitiallyVisible: true,
        valueGetter: (params) => params.row.props.read_max_n_cases,
      },
      {
        id: 'create_max_n_cases',
        headerName: t`Create max number of cases`,
        widthFlex: 1,
        type: 'number',
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        textAlign: 'right',
        isInitiallyVisible: true,
        valueGetter: (params) => params.row.props.create_max_n_cases,
      },
      {
        id: 'update_max_n_cases',
        headerName: t`Update max number of cases`,
        widthFlex: 1,
        type: 'number',
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        textAlign: 'right',
        isInitiallyVisible: true,
        valueGetter: (params) => params.row.props.update_max_n_cases,
      },
      {
        id: 'delete_max_n_cases',
        headerName: t`Delete max number of cases`,
        widthFlex: 1,
        type: 'number',
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        textAlign: 'right',
        isInitiallyVisible: true,
        valueGetter: (params) => params.row.props.delete_max_n_cases,
      },
      {
        id: 'read_max_tree_size',
        headerName: t`Read max tree size`,
        widthFlex: 1,
        type: 'number',
        comparatorFactory: TableUtil.createNumberCellRowComperator,
        textAlign: 'right',
        isInitiallyVisible: true,
        valueGetter: (params) => params.row.props.read_max_tree_size,
      },
    ];
  }, [etiologicalAgentOptionsQuery.options, diseaseOptionsQuery.options, t]);

  const subPages = useMemo<CrudPageSubPage<CaseType>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.DimCrudCommand, permission_type: PermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        label: t`Manage dimensions`,
        getPathName: (item: CaseType) => `/management/case-types/${item.id}/dimensions`,
      } satisfies CrudPageSubPage<CaseType>,
    ];
  }, [t]);

  const getFormValuesFromItem = useCallback((item: CaseType): Partial<FormFields> => {
    if (!item) {
      return {};
    }
    return {
      name: item.name,
      description: item.description,
      disease_id: item.disease_id,
      etiological_agent_id: item.etiological_agent_id,
      create_max_n_cases: item.props.create_max_n_cases,
      delete_max_n_cases: item.props.delete_max_n_cases,
      read_max_n_cases: item.props.read_max_n_cases,
      read_max_tree_size: item.props.read_max_tree_size,
      update_max_n_cases: item.props.update_max_n_cases,
    };
  }, []);

  return (
    <CrudPage<FormFields, CaseType>
      getFormValuesFromItem={getFormValuesFromItem}
      createOne={createOne}
      subPages={subPages}
      crudCommandType={CommandName.CaseTypeCrudCommand}
      createItemDialogTitle={t`Create new case type`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypesAdminPage')}
      title={t`Case types`}
      updateOne={updateOne}
    />
  );
};
