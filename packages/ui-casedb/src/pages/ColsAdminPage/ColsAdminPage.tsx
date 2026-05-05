import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';
import type { UseFormReturn } from 'react-hook-form';
import type { CaseDbCol } from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbColType,
  CaseDbCommandName,
} from '@gen-epix/api-casedb';

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
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<CaseDbCol, 'case_type' | 'dim' | 'props' | 'ref_col'>;

const NCBI_TAXID_REGEX = /^NCBI:txid\d+/;

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
  const dimOptionsByCaseTypeIdCacheRef = useRef(new Map<string, OptionBase<string>[]>());
  const refColOptionsByDimIdCacheRef = useRef(new Map<string, OptionBase<string>[]>());
  const geneticSequenceColOptionsByCaseTypeIdCacheRef = useRef(new Map<string, OptionBase<string>[]>());

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
    return (await CaseDbCaseApi.instance.colsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((cols: CaseDbCol[]) => {
    if (dimId) {
      return cols.filter((col) => col.dim_id === dimId);
    }
    return cols;
  }, [dimId]);

  const deleteOne = useCallback(async (item: CaseDbCol) => {
    return await CaseDbCaseApi.instance.colsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbCol) => {
    return (await CaseDbCaseApi.instance.colsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbCaseApi.instance.colsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbCol) => {
    return item.label;
  }, []);

  const getDimOptionsForCaseTypeId = useCallback((id: string): OptionBase<string>[] => {
    if (dimOptionsByCaseTypeIdCacheRef.current.has(id)) {
      return dimOptionsByCaseTypeIdCacheRef.current.get(id);
    }
    const options = DataUtil.getDimOptionsForCaseTypeId({
      caseTypeId: id,
      dimMap: dimMapQuery.map,
      dimOptions: dimOptionsQuery.options,
    });
    dimOptionsByCaseTypeIdCacheRef.current.set(id, options);
    return options;
  }, [dimMapQuery.map, dimOptionsQuery.options]);

  const getRefColOptionsForDimId = useCallback((id: string): OptionBase<string>[] => {
    if (refColOptionsByDimIdCacheRef.current.has(id)) {
      return refColOptionsByDimIdCacheRef.current.get(id);
    }
    const options = DataUtil.getRefColOptionsForDimId({
      colsValidationRules: colsValidationRulesQuery.data?.valid_col_types_by_dim_type ?? {},
      dimId: id,
      dimMap: dimMapQuery.map,
      refColMap: refColMapQuery.map,
      refColOptions: refColOptionsQuery.options,
      refDimMap: refDimMapQuery.map,
    });
    refColOptionsByDimIdCacheRef.current.set(id, options);
    return options;
  }, [dimMapQuery.map, refColMapQuery.map, refColOptionsQuery.options, colsValidationRulesQuery.data?.valid_col_types_by_dim_type, refDimMapQuery.map]);

  const getGeneticSequenceColOptionsForCaseTypeId = useCallback((id: string): OptionBase<string>[] => {
    if (geneticSequenceColOptionsByCaseTypeIdCacheRef.current.has(id)) {
      return geneticSequenceColOptionsByCaseTypeIdCacheRef.current.get(id);
    }
    const options = DataUtil.getGeneticSequenceColOptionsForCaseTypeId({
      caseTypeId: id,
      colMap: colMapQuery.map,
      colOptions: colOptionsQuery.options,
      refColMap: refColMapQuery.map,
    });
    geneticSequenceColOptionsByCaseTypeIdCacheRef.current.set(id, options);
    return options;
  }, [refColMapQuery.map, colMapQuery.map, colOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      case_type_id: string().uuid4().required().max(100),
      code: SchemaUtil.code,
      description: SchemaUtil.description,
      dim_id: string().uuid4().required().max(100),
      genetic_sequence_col_id: string().when('ref_col_id', {
        is: (ref_col_id: string) => refColMapQuery.map.get(ref_col_id)?.col_type === CaseDbColType.GENETIC_DISTANCE,
        otherwise: () => string().nullable().notRequired(),
        then: () => string().uuid4().required(),
      }),
      label: SchemaUtil.label,
      max_datetime: SchemaUtil.isoString.optional(),
      max_length: SchemaUtil.number.integer().positive().max(10000),
      max_value: SchemaUtil.number.positive().max(10000),
      min_datetime: SchemaUtil.isoString.optional(),
      min_length: SchemaUtil.number.integer().positive().max(10000),
      min_value: SchemaUtil.number.positive().max(10000),
      ncbi_taxid: string().when('ref_col_id', {
        is: (ref_col_id: string) => refColMapQuery.map.get(ref_col_id)?.col_type === CaseDbColType.GENETIC_DISTANCE,
        otherwise: () => string().notRequired(),
        then: () => string().matches(NCBI_TAXID_REGEX).required(),
      }),
      pattern: string().regex(),
      rank: SchemaUtil.rank,
      ref_col_id: string().uuid4().required().max(100),
      tree_algorithm_codes: array().when('ref_col_id', {
        is: (ref_col_id: string) => refColMapQuery.map.get(ref_col_id)?.col_type === CaseDbColType.GENETIC_DISTANCE,
        otherwise: () => array().nullable().notRequired(),
        then: () => array().min(1).required(),
      }),
    });
  }, [refColMapQuery.map]);

  const onFormChange = useCallback((_item: CaseDbCol, values: FormFields, formMethods: UseFormReturn<FormFields>) => {
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

  const formFieldDefinitions = useCallback((item: CaseDbCol, values: FormFields): FormFieldDefinition<FormFields>[] => {
    const normalizedDimId = values?.dim_id ?? item?.dim_id ?? null;
    const caseTypeIdFromDimId = dimMapQuery.map.get(normalizedDimId)?.case_type_id ?? null;
    const normalizedCaseTypeIdWithValues = values?.case_type_id ?? normalizedCaseTypeId ?? caseTypeIdFromDimId;

    const dimOptions = getDimOptionsForCaseTypeId(normalizedCaseTypeIdWithValues);
    const refColOptions = getRefColOptionsForDimId(normalizedDimId);
    const geneticSequenceColOptions = getGeneticSequenceColOptionsForCaseTypeId(normalizedCaseTypeIdWithValues);

    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!item,
        label: t`Case type`,
        name: 'case_type_id',
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!item,
        label: t`Dimension`,
        name: 'dim_id',
        options: dimOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!item,
        label: t`Reference column`,
        name: 'ref_col_id',
        options: refColOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Rank`,
        name: 'rank',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Label`,
        name: 'label',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Min value`,
        name: 'min_value',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Max value`,
        name: 'max_value',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        dateFormat: DATE_FORMAT.DATE_TIME,
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        label: t`Min datetime`,
        name: 'min_datetime',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        dateFormat: DATE_FORMAT.DATE_TIME,
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        label: t`Max datetime`,
        name: 'max_datetime',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Min length`,
        name: 'min_length',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Max length`,
        name: 'max_length',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
        label: t`Genetic sequence column`,
        name: 'genetic_sequence_col_id',
        options: geneticSequenceColOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
        label: t`Tree algorithm codes`,
        multiple: true,
        name: 'tree_algorithm_codes',
        options: treeAlgorithmCodesOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`NCBI TaxID`,
        name: 'ncbi_taxid',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Pattern`,
        name: 'pattern',
        type: 'text',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const satisfies FormFieldDefinition<FormFields>[];
  }, [dimMapQuery.map, caseTypeOptionsQuery.options, getDimOptionsForCaseTypeId, getRefColOptionsForDimId, getGeneticSequenceColOptionsForCaseTypeId, normalizedCaseTypeId, t, treeAlgorithmCodesOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<CaseDbCol>[] => {
    const columns: TableColumn<CaseDbCol>[] = [];
    if (!caseTypeId) {
      columns.push(TableUtil.createOptionsColumn<CaseDbCol>({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options }));
    }
    if (!dimId) {
      columns.push(TableUtil.createOptionsColumn<CaseDbCol>({ id: 'dim_id', name: t`Dimension`, options: dimOptionsQuery.options }));
    }

    columns.push(
      TableUtil.createOptionsColumn<CaseDbCol>({ id: 'ref_col_id', name: t`Column`, options: refColOptionsQuery.options }),
      TableUtil.createTextColumn<CaseDbCol>({ id: 'code', name: t`Code` }),
      TableUtil.createNumberColumn<CaseDbCol>({ id: 'rank', name: t`Rank` }),
    );
    return columns;
  }, [dimId, dimOptionsQuery.options, caseTypeId, caseTypeOptionsQuery.options, refColOptionsQuery.options, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: CaseDbCol): CaseDbCol => {
    return {
      case_type_id: previousItem.case_type_id,
      dim_id: previousItem.dim_id,
      id: previousItem.id,
      ...variables,
    };
  }, []);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      case_type_id: normalizedCaseTypeId,
      dim_id: dimId ?? null,
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
    <CrudPage<FormFields, CaseDbCol>
      createItemDialogTitle={t`Create new column`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.ColCrudCommand}
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
      onFormChange={onFormChange}
      resourceQueryKeyBase={QUERY_KEY.COLS}
      schema={schema}
      tableColumns={tableColumns}
      tableStoreStorageNamePostFix={tableStoreStorageNamePostFix}
      testIdAttributes={TestIdUtil.createAttributes('ColsAdminPage')}
      title={title}
      updateOne={updateOne}
    />
  );
};
