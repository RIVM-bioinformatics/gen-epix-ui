import {
  useCallback,
  useMemo,
  useRef,
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

import type { Col } from '../../api';
import {
  CaseApi,
  ColType,
  CommandName,
} from '../../api';
import {
  useColMapQuery,
  useColOptionsQuery,
} from '../../dataHooks/useColsQuery';
import {
  useCaseTypeMapQuery,
  useCaseTypeOptionsQuery,
} from '../../dataHooks/useCaseTypesQuery';
import {
  useRefColMapQuery,
  useRefColOptionsQuery,
} from '../../dataHooks/useRefColsQuery';
import { useTreeAlgorithmCodeOptionsQuery } from '../../dataHooks/useTreeAlgorithmCodesQuery';
import { useArray } from '../../hooks/useArray';
import type {
  FormFieldDefinition,
  OptionBase,
} from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { DATE_FORMAT } from '../../data/date';
import {
  useDimMapQuery,
  useDimOptionsQuery,
} from '../../dataHooks/useDimsQuery';
import { useRefColsValidationRulesQuery } from '../../dataHooks/useRefColsValidationRulesQuery';
import { useRefDimMapQuery } from '../../dataHooks/useRefDimsQuery';
import { DataUtil } from '../../utils/DataUtil';
import { NumberUtil } from '../../utils/NumberUtil';

type FormFields = Pick<Col, 'case_type_id' | 'ref_col_id' | 'dim_id' | 'code' | 'rank' | 'label' | 'description' | 'min_value' | 'max_value' | 'min_datetime' | 'max_datetime' | 'min_length' | 'genetic_sequence_col_id' | 'tree_algorithm_codes' | 'pattern'>;

export const ColsAdminPage = () => {
  const { t } = useTranslation();
  const { caseTypeId, dimId } = useParams();
  const refColOptionsQuery = useRefColOptionsQuery();
  const refColMapQuery = useRefColMapQuery();
  const refDimMapQuery = useRefDimMapQuery();
  const treeAlgorithmCodesOptionsQuery = useTreeAlgorithmCodeOptionsQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const colOptionsQuery = useColOptionsQuery();
  const colMapQuery = useColMapQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();
  const dimMapQuery = useDimMapQuery();
  const dimOptionsQuery = useDimOptionsQuery();
  const colsValidationRulesQuery = useRefColsValidationRulesQuery();
  const loadables = useArray([refDimMapQuery, refColMapQuery, colsValidationRulesQuery, dimOptionsQuery, dimMapQuery, caseTypeMapQuery, caseTypeOptionsQuery, refColOptionsQuery, treeAlgorithmCodesOptionsQuery, colOptionsQuery]);
  const dimOptionsByCaseTypeIdCache = useRef(new Map<string, OptionBase<string>[]>());
  const refColOptionsByDimIdCache = useRef(new Map<string, OptionBase<string>[]>());
  const geneticSequenceColOptionsByCaseTypeIdCache = useRef(new Map<string, OptionBase<string>[]>());

  const normalizedCaseTypeId = useMemo(() => {
    if (dimId) {
      return dimMapQuery.map.get(dimId)?.case_type_id ?? null;
    }
    if (caseTypeId) {
      return caseTypeId;
    }
    return null;
  }, [dimId, dimMapQuery.map, caseTypeId]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.colsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((cols: Col[]) => {
    if (dimId) {
      return cols.filter((col) => col.dim_id === dimId);
    }
    return cols;
  }, [dimId]);

  const deleteOne = useCallback(async (item: Col) => {
    return await CaseApi.instance.colsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Col) => {
    return (await CaseApi.instance.colsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.colsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Col) => {
    return item.label;
  }, []);

  const getDimOptionsForCaseTypeId = useCallback((id: string): OptionBase<string>[] => {
    if (dimOptionsByCaseTypeIdCache.current.has(id)) {
      return dimOptionsByCaseTypeIdCache.current.get(id);
    }
    const options = DataUtil.getDimOptionsForCaseTypeId({
      caseTypeId: id,
      dimOptions: dimOptionsQuery.options,
      dimMap: dimMapQuery.map,
    });
    dimOptionsByCaseTypeIdCache.current.set(id, options);
    return options;
  }, [dimMapQuery.map, dimOptionsQuery.options]);

  const getRefColOptionsForDimId = useCallback((id: string): OptionBase<string>[] => {
    if (refColOptionsByDimIdCache.current.has(id)) {
      return refColOptionsByDimIdCache.current.get(id);
    }
    const options = DataUtil.getRefColOptionsForDimId({
      dimId: id,
      dimMap: dimMapQuery.map,
      refDimMap: refDimMapQuery.map,
      refColOptions: refColOptionsQuery.options,
      refColMap: refColMapQuery.map,
      colsValidationRules: colsValidationRulesQuery.data?.valid_col_types_by_dim_type ?? {},
    });
    refColOptionsByDimIdCache.current.set(id, options);
    return options;
  }, [dimMapQuery.map, refColMapQuery.map, refColOptionsQuery.options, colsValidationRulesQuery.data?.valid_col_types_by_dim_type, refDimMapQuery.map]);

  const getGeneticSequenceColOptionsForCaseTypeId = useCallback((id: string): OptionBase<string>[] => {
    if (geneticSequenceColOptionsByCaseTypeIdCache.current.has(id)) {
      return geneticSequenceColOptionsByCaseTypeIdCache.current.get(id);
    }
    const options = DataUtil.getGeneticSequenceColOptionsForCaseTypeId({
      caseTypeId: id,
      refColMap: refColMapQuery.map,
      colMap: colMapQuery.map,
      colOptions: colOptionsQuery.options,
    });
    geneticSequenceColOptionsByCaseTypeIdCache.current.set(id, options);
    return options;
  }, [refColMapQuery.map, colMapQuery.map, colOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      rank: NumberUtil.yup.required().min(0).integer(),
      ref_col_id: string().uuid4().required().max(100),
      dim_id: string().uuid4().required().max(100),
      case_type_id: string().uuid4().required().max(100),
      description: string().freeFormText().required().max(100),
      min_value: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      max_value: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      min_datetime: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      max_datetime: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      min_length: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      max_length: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      genetic_sequence_col_id: string().when('ref_col_id', {
        is: (ref_col_id: string) => refColMapQuery.map.get(ref_col_id)?.col_type === ColType.GENETIC_DISTANCE,
        then: () => string().uuid4().required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      tree_algorithm_codes: array().when('ref_col_id', {
        is: (ref_col_id: string) => refColMapQuery.map.get(ref_col_id)?.col_type === ColType.GENETIC_DISTANCE,
        then: () => array().min(1).required(),
        otherwise: () => array().nullable().notRequired(),
      }),
      pattern: string().regex(),
    });
  }, [refColMapQuery.map]);

  const onFormChange = useCallback((_item: Col, values: FormFields, formMethods: UseFormReturn<FormFields>) => {
    if (values.case_type_id && values.dim_id) {
      const validDimOptions = getDimOptionsForCaseTypeId(values.case_type_id);
      if (!validDimOptions.find(option => option.value === values.dim_id)) {
        formMethods.setValue('dim_id', validDimOptions.length === 1 ? validDimOptions[0].value : null);
        formMethods.setValue('ref_col_id', null);
      }
    }

    if (values.dim_id && values.ref_col_id) {
      const validColOptions = getRefColOptionsForDimId(values.dim_id);
      if (!validColOptions.find(option => option.value === values.ref_col_id)) {
        formMethods.setValue('ref_col_id', validColOptions.length === 1 ? validColOptions[0].value : null);
      }
    }

    if (values.case_type_id && values.genetic_sequence_col_id) {
      const validColOptions = getGeneticSequenceColOptionsForCaseTypeId(values.case_type_id);
      if (!validColOptions.find(option => option.value === values.genetic_sequence_col_id)) {
        formMethods.setValue('genetic_sequence_col_id', validColOptions.length === 1 ? validColOptions[0].value : null);
      }
    }
  }, [getDimOptionsForCaseTypeId, getRefColOptionsForDimId, getGeneticSequenceColOptionsForCaseTypeId]);

  const formFieldDefinitions = useCallback((item: Col, values: FormFields): FormFieldDefinition<FormFields>[] => {
    const normalizedDimId = values?.dim_id ?? item?.dim_id ?? null;
    const caseTypeIdFromDimId = dimMapQuery.map.get(normalizedDimId)?.case_type_id ?? null;
    const normalizedCaseTypeIdWithValues = values?.case_type_id ?? normalizedCaseTypeId ?? caseTypeIdFromDimId;

    const dimOptions = getDimOptionsForCaseTypeId(normalizedCaseTypeIdWithValues);
    const refColOptions = getRefColOptionsForDimId(normalizedDimId);
    const geneticSequenceColOptions = getGeneticSequenceColOptionsForCaseTypeId(normalizedCaseTypeIdWithValues);

    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_id',
        label: t`Case type`,
        options: caseTypeOptionsQuery.options,
        disabled: !!item,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'dim_id',
        label: t`Dimension`,
        options: dimOptions,
        disabled: !!item,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'ref_col_id',
        label: t`Reference column`,
        options: refColOptions,
        disabled: !!item,
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
        label: t`Min length`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
        name: 'genetic_sequence_col_id',
        label: t`Genetic sequence column`,
        options: geneticSequenceColOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
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
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'pattern',
        label: t`Pattern`,
        type: 'text',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const satisfies FormFieldDefinition<FormFields>[];
  }, [dimMapQuery.map, caseTypeOptionsQuery.options, getDimOptionsForCaseTypeId, getRefColOptionsForDimId, getGeneticSequenceColOptionsForCaseTypeId, normalizedCaseTypeId, t, treeAlgorithmCodesOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<Col>[] => {
    const columns: TableColumn<Col>[] = [];
    if (!caseTypeId) {
      columns.push(TableUtil.createOptionsColumn<Col>({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options }));
    }
    if (!dimId) {
      columns.push(TableUtil.createOptionsColumn<Col>({ id: 'dim_id', name: t`Dimension`, options: dimOptionsQuery.options }));
    }

    columns.push(
      TableUtil.createOptionsColumn<Col>({ id: 'ref_col_id', name: t`Column`, options: refColOptionsQuery.options }),
      TableUtil.createTextColumn<Col>({ id: 'code', name: t`Code` }),
      TableUtil.createNumberColumn<Col>({ id: 'rank', name: t`Rank` }),
    );
    return columns;
  }, [dimId, dimOptionsQuery.options, caseTypeId, caseTypeOptionsQuery.options, refColOptionsQuery.options, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: Col): Col => {
    return {
      id: previousItem.id,
      case_type_id: previousItem.case_type_id,
      dim_id: previousItem.dim_id,
      ...variables,
    };
  }, []);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      dim_id: dimId ?? null,
      case_type_id: normalizedCaseTypeId,
    };
  }, [dimId, normalizedCaseTypeId]);

  const title = useMemo(() => {
    const parts: string[] = [];

    if (caseTypeId && caseTypeMapQuery.map.has(caseTypeId)) {
      parts.push(caseTypeMapQuery.map.get(caseTypeId)?.name);
    }
    if (dimId && dimMapQuery.map.has(dimId)) {
      parts.push(dimMapQuery.map.get(dimId)?.label);
    }
    parts.push(t`Columns`);

    return parts;
  }, [caseTypeId, dimId, caseTypeMapQuery.map, dimMapQuery.map, t]);

  const tableStoreStorageNamePostFix = useMemo(() => {
    const parts: string[] = [];
    if (caseTypeId) {
      parts.push('CaseType');
    }
    if (dimId) {
      parts.push('Dim');
    }
    return parts.join('_');
  }, [dimId, caseTypeId]);

  return (
    <CrudPage<FormFields, Col>
      createItemDialogTitle={t`Create new column`}
      createOne={createOne}
      crudCommandType={CommandName.ColCrudCommand}
      defaultNewItem={defaultNewItem}
      defaultSortByField={(dimId ?? caseTypeId) ? 'rank' : 'case_type_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.COLS}
      schema={schema}
      tableColumns={tableColumns}
      tableStoreStorageNamePostFix={tableStoreStorageNamePostFix}
      testIdAttributes={TestIdUtil.createAttributes('ColsAdminPage')}
      title={title}
      updateOne={updateOne}
      onFormChange={onFormChange}
    />
  );
};
