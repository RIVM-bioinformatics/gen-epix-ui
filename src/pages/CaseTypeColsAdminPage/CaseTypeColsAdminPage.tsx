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
import { isValid } from 'date-fns';
import { useParams } from 'react-router-dom';
import type { UseFormReturn } from 'react-hook-form';

import type { CaseTypeCol } from '../../api';
import {
  CaseApi,
  CommandName,
} from '../../api';
import { useCaseTypeColOptionsQuery } from '../../dataHooks/useCaseTypeColsQuery';
import {
  useCaseTypeMapQuery,
  useCaseTypeOptionsQuery,
} from '../../dataHooks/useCaseTypesQuery';
import {
  useColMapQuery,
  useColOptionsQuery,
} from '../../dataHooks/useColsQuery';
import { useTreeAlgorithmCodeOptionsQuery } from '../../dataHooks/useTreeAlgorithmCodesQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { DATE_FORMAT } from '../../data/date';
import {
  useCaseTypeDimMapQuery,
  useCaseTypeDimOptionsQuery,
} from '../../dataHooks/useCaseTypeDimsQuery';
import { useColsValidationRulesQuery } from '../../dataHooks/useColsValidationRulesQuery';
import { useDimMapQuery } from '../../dataHooks/useDimsQuery';
import { DataUtil } from '../../utils/DataUtil';

type FormFields = Pick<CaseTypeCol, 'case_type_id' | 'col_id' | 'case_type_dim_id' | 'code' | 'rank' | 'label' | 'description' | 'min_value' | 'max_value' | 'min_datetime' | 'max_datetime' | 'min_length' | 'genetic_sequence_case_type_col_id' | 'tree_algorithm_codes' | 'pattern'>;

export const CaseTypeColsAdminPage = () => {
  const [t] = useTranslation();
  const { caseTypeId, caseTypeDimId } = useParams();
  const colOptionsQuery = useColOptionsQuery();
  const colMapQuery = useColMapQuery();
  const dimMapQuery = useDimMapQuery();
  const treeAlgorithmCodesOptionsQuery = useTreeAlgorithmCodeOptionsQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseTypeColOptionsQuery = useCaseTypeColOptionsQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();
  const caseTypeDimMapQuery = useCaseTypeDimMapQuery();
  const caseTypeDimOptionsQuery = useCaseTypeDimOptionsQuery();
  const colsValidationRulesQuery = useColsValidationRulesQuery();
  const loadables = useArray([dimMapQuery, colMapQuery, colsValidationRulesQuery, caseTypeDimOptionsQuery, caseTypeDimMapQuery, caseTypeMapQuery, caseTypeOptionsQuery, colOptionsQuery, treeAlgorithmCodesOptionsQuery, caseTypeColOptionsQuery]);

  const normalizedCaseTypeId = useMemo(() => {
    if (caseTypeDimId) {
      return caseTypeDimMapQuery.map.get(caseTypeDimId)?.case_type_id ?? null;
    }
    if (caseTypeId) {
      return caseTypeId;
    }
    return null;
  }, [caseTypeDimId, caseTypeDimMapQuery.map, caseTypeId]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.caseTypeColsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((cols: CaseTypeCol[]) => {
    if (caseTypeDimId) {
      return cols.filter((col) => col.case_type_dim_id === caseTypeDimId);
    }
    return cols;
  }, [caseTypeDimId]);

  const deleteOne = useCallback(async (item: CaseTypeCol) => {
    return await CaseApi.instance.caseTypeColsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeCol) => {
    return (await CaseApi.instance.caseTypeColsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.caseTypeColsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseTypeCol) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      rank: number().integer().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      col_id: string().uuid4().required().max(100),
      case_type_dim_id: string().uuid4().required().max(100),
      case_type_id: string().uuid4().required().max(100),
      description: string().freeFormText().required().max(100),
      min_value: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      max_value: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      min_datetime: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      max_datetime: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      min_length: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      max_length: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      genetic_sequence_case_type_col_id: string().uuid4().transform((_val: unknown, orig: string) => orig === null || undefined ? undefined : orig),
      tree_algorithm_codes: array(),
      pattern: string().freeFormText(),
    });
  }, []);

  const caseTypeDimOptionsByCaseTypeId = useMemo(() => {
    return DataUtil.getCaseTypeDimOptionsByCaseTypeId({ caseTypeDimOptions: caseTypeDimOptionsQuery.options, caseTypeDimMap: caseTypeDimMapQuery.map });
  }, [caseTypeDimMapQuery.map, caseTypeDimOptionsQuery.options]);

  const colOptionsByCaseTypeDimId = useMemo(() => {
    return DataUtil.getColOptionsByCaseTypeDimId({ caseTypeDimMap: caseTypeDimMapQuery.map, dimMap: dimMapQuery.map, colOptions: colOptionsQuery.options, colMap: colMapQuery.map, colsValidationRules: colsValidationRulesQuery.data?.valid_col_types_by_dim_type ?? {} });
  }, [caseTypeDimMapQuery.map, dimMapQuery.map, colOptionsQuery.options, colMapQuery.map, colsValidationRulesQuery.data?.valid_col_types_by_dim_type]);

  const onFormChange = useCallback((_item: CaseTypeCol, values: FormFields, formMethods: UseFormReturn<FormFields>) => {
    if (values.case_type_id && values.case_type_dim_id) {
      const validCaseTypeDimOptions = caseTypeDimOptionsByCaseTypeId.get(values.case_type_id);
      if (!validCaseTypeDimOptions.find(option => option.value === values.case_type_dim_id)) {
        formMethods.setValue('case_type_dim_id', validCaseTypeDimOptions.length === 1 ? validCaseTypeDimOptions[0].value : null);
        formMethods.setValue('col_id', null);
      }
    }

    if (values.case_type_dim_id && values.col_id) {
      const validColOptions = colOptionsByCaseTypeDimId.get(values.case_type_dim_id);
      if (!validColOptions.find(option => option.value === values.col_id)) {
        formMethods.setValue('col_id', validColOptions.length === 1 ? validColOptions[0].value : null);
      }
    }
  }, [caseTypeDimOptionsByCaseTypeId, colOptionsByCaseTypeDimId]);

  const formFieldDefinitions = useCallback((item: CaseTypeCol, values: FormFields): FormFieldDefinition<FormFields>[] => {
    const definitions: FormFieldDefinition<FormFields>[] = [];
    const normalizedCaseTypeIdWithValues = values?.case_type_id ?? normalizedCaseTypeId;

    const caseTypeDimOptions = normalizedCaseTypeIdWithValues ?
      (caseTypeDimOptionsByCaseTypeId.get(normalizedCaseTypeIdWithValues) ?? []) :
      caseTypeDimOptionsQuery.options;

    const colOptions = values?.case_type_dim_id ?
      (colOptionsByCaseTypeDimId.get(values.case_type_dim_id) ?? []) :
      colOptionsQuery.options;

    if (!caseTypeId) {
      definitions.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_id',
        label: t`Case type`,
        options: caseTypeOptionsQuery.options,
        disabled: !!item,
      } as const satisfies FormFieldDefinition<FormFields>);
    }

    if (!caseTypeDimId) {
      definitions.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_dim_id',
        label: t`Case type dimension`,
        options: caseTypeDimOptions,
        disabled: !!item || !values?.case_type_id,
      } as const satisfies FormFieldDefinition<FormFields>);
    }

    definitions.push(
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'col_id',
        label: t`Column`,
        options: colOptions,
        disabled: !!item || !values?.case_type_dim_id,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'label',
        label: t`Label`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'min_value',
        label: t`Min value`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'max_value',
        label: t`Max value`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'min_datetime',
        label: t`Min datetime`,
        dateFormat: DATE_FORMAT.DATE_TIME,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'max_datetime',
        label: t`Max datetime`,
        dateFormat: DATE_FORMAT.DATE_TIME,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'min_length',
        label: t`Min value`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'genetic_sequence_case_type_col_id',
        label: t`Genetic sequence case type column`,
        options: caseTypeColOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'tree_algorithm_codes',
        label: t`Tree algorithm codes`,
        options: treeAlgorithmCodesOptionsQuery.options,
        multiple: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    );
    return definitions;
  }, [caseTypeColOptionsQuery.options, caseTypeDimId, caseTypeDimOptionsByCaseTypeId, caseTypeDimOptionsQuery.options, caseTypeId, caseTypeOptionsQuery.options, colOptionsByCaseTypeDimId, colOptionsQuery.options, normalizedCaseTypeId, t, treeAlgorithmCodesOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<CaseTypeCol>[] => {
    const columns: TableColumn<CaseTypeCol>[] = [];
    if (!caseTypeId) {
      columns.push(TableUtil.createOptionsColumn<CaseTypeCol>({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options }));
    }
    if (!caseTypeDimId) {
      columns.push(TableUtil.createOptionsColumn<CaseTypeCol>({ id: 'case_type_dim_id', name: t`Case type dimension`, options: caseTypeDimOptionsQuery.options }));
    }

    columns.push(
      TableUtil.createOptionsColumn<CaseTypeCol>({ id: 'col_id', name: t`Column`, options: colOptionsQuery.options }),
      TableUtil.createTextColumn<CaseTypeCol>({ id: 'code', name: t`Code` }),
      TableUtil.createNumberColumn<CaseTypeCol>({ id: 'rank', name: t`Rank` }),
    );
    return columns;
  }, [caseTypeDimId, caseTypeDimOptionsQuery.options, caseTypeId, caseTypeOptionsQuery.options, colOptionsQuery.options, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: CaseTypeCol): CaseTypeCol => {
    return {
      id: previousItem.id,
      case_type_id: previousItem.case_type_id,
      case_type_dim_id: previousItem.case_type_dim_id,
      ...variables,
    };
  }, []);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      case_type_dim_id: caseTypeDimId ?? null,
      case_type_id: normalizedCaseTypeId,
    };
  }, [caseTypeDimId, normalizedCaseTypeId]);

  const title = useMemo(() => {
    const parts: string[] = [];

    if (caseTypeId && caseTypeMapQuery.map.has(caseTypeId)) {
      parts.push(caseTypeMapQuery.map.get(caseTypeId)?.name);
    }
    if (caseTypeDimId && caseTypeDimMapQuery.map.has(caseTypeDimId)) {
      parts.push(caseTypeDimMapQuery.map.get(caseTypeDimId)?.label);
    }
    parts.push(t`Case type columns`);

    return parts;
  }, [caseTypeId, caseTypeDimId, caseTypeMapQuery.map, caseTypeDimMapQuery.map, t]);
  return (
    <CrudPage<FormFields, CaseTypeCol>
      createOne={createOne}
      defaultNewItem={defaultNewItem}
      crudCommandType={CommandName.CaseTypeColCrudCommand}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      createItemDialogTitle={t`Create new case type column`}
      defaultSortByField={(caseTypeDimId ?? caseTypeId) ? 'rank' : 'case_type_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPE_COLS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeColsAdminPage')}
      title={title}
      updateOne={updateOne}
      onFormChange={onFormChange}
    />
  );
};
