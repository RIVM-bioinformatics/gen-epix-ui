import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';
import type { UseFormReturn } from 'react-hook-form';
import type { CaseDbRefCol } from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbColType,
  CaseDbCommandName,
} from '@gen-epix/api-casedb';
import type {
  FormFieldDefinition,
  OmitWithMetaData,
  OptionBase,
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

import { useColTypeOptionsQuery } from '../../dataHooks/useColTypesQuery';
import { useConceptSetOptionsQuery } from '../../dataHooks/useConceptSetsQuery';
import {
  useRefDimMapQuery,
  useRefDimOptionsQuery,
} from '../../dataHooks/useRefDimsQuery';
import { useGeneticDistanceProtocolOptionsQuery } from '../../dataHooks/useGeneticDistanceProtocolsQuery';
import { useRegionSetOptionsQuery } from '../../dataHooks/useRegionSetsQuery';
import { CASEDB_QUERY_KEY } from '../../data/query';
import { useRefColsValidationRulesQuery } from '../../dataHooks/useRefColsValidationRulesQuery';
import { CaseDbDataUtil } from '../../utils/CaseDbDataUtil';

type FormFields = OmitWithMetaData<CaseDbRefCol, 'concept_set' | 'genetic_distance_protocol' | 'props' | 'ref_dim' | 'region_set'>;

const CONCEPT_COL_TYPES: CaseDbColType[] = [CaseDbColType.NOMINAL, CaseDbColType.ORDINAL, CaseDbColType.INTERVAL];

export const RefColsAdminPage = () => {
  const { refDimId } = useParams();
  const { t } = useTranslation();
  const refDimOptionsQuery = useRefDimOptionsQuery();
  const refDimMapQuery = useRefDimMapQuery();
  const colTypeOptionsQuery = useColTypeOptionsQuery();
  const conceptSetOptionsQuery = useConceptSetOptionsQuery();
  const regionSetOptionsQuery = useRegionSetOptionsQuery();
  const geneticDistanceProtocolOptionsQuery = useGeneticDistanceProtocolOptionsQuery();
  const colsValidationRulesQuery = useRefColsValidationRulesQuery();
  const colTypeOptionsByDimIdCacheRef = useRef(new Map<string, OptionBase<string>[]>());

  const loadables = useArray([refDimMapQuery, refDimOptionsQuery, colTypeOptionsQuery, conceptSetOptionsQuery, regionSetOptionsQuery, geneticDistanceProtocolOptionsQuery, colsValidationRulesQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().refColsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((refCols: CaseDbRefCol[]) => {
    if (refDimId) {
      return refCols.filter((refCol) => refCol.ref_dim_id === refDimId);
    }
    return refCols;
  }, [refDimId]);

  const deleteOne = useCallback(async (item: CaseDbRefCol) => {
    return await CaseDbCaseApi.getInstance().refColsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbRefCol) => {
    return (await CaseDbCaseApi.getInstance().refColsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbCaseApi.getInstance().refColsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbRefCol) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      code_suffix: string().alphaNumeric().required().max(100),
      col_type: mixed<CaseDbColType>().required().oneOf(Object.values(CaseDbColType)),
      concept_set_id: string().when('col_type', {
        is: (colType: CaseDbColType) => CONCEPT_COL_TYPES.includes(colType),
        otherwise: () => string().nullable().notRequired(),
        then: () => string().uuid4().required(),
      }),
      description: SchemaUtil.description,
      genetic_distance_protocol_id: string().when('col_type', {
        is: (col_type: CaseDbColType) => col_type === CaseDbColType.GENETIC_DISTANCE,
        otherwise: () => string().nullable().notRequired(),
        then: () => string().uuid4().required(),
      }),
      label: SchemaUtil.label,
      rank: SchemaUtil.rank,
      ref_dim_id: string().uuid4().required().max(100),
      regex: string().when('col_type', {
        is: (col_type: CaseDbColType) => col_type === CaseDbColType.REGULAR_LANGUAGE,
        otherwise: () => string().regex().max(500).nullable().notRequired(),
        then: () => string().regex().max(500).required(),
      }),
      region_set_id: string().when('col_type', {
        is: (col_type: CaseDbColType) => col_type === CaseDbColType.GEO_REGION,
        otherwise: () => string().nullable().notRequired(),
        then: () => string().uuid4().required(),
      }),
      schema_definition: string().when('col_type', {
        is: (col_type: CaseDbColType) => ([CaseDbColType.CONTEXT_FREE_GRAMMAR_JSON, CaseDbColType.CONTEXT_FREE_GRAMMAR_XML] as CaseDbColType[]).includes(col_type),
        otherwise: () => string().nullable().notRequired(),
        then: () => string().freeFormText().max(10000).required(),
      }),
      schema_uri: string().when('col_type', {
        is: (col_type: CaseDbColType) => ([CaseDbColType.CONTEXT_FREE_GRAMMAR_JSON, CaseDbColType.CONTEXT_FREE_GRAMMAR_XML] as CaseDbColType[]).includes(col_type),
        otherwise: () => string().url().max(1000).nullable().notRequired(),
        then: () => string().url().max(1000).required(),
      }),
    });
  }, []);

  const getColTypeOptionsForDimId = useCallback((id: string): OptionBase<string>[] => {
    if (colTypeOptionsByDimIdCacheRef.current.has(id)) {
      return colTypeOptionsByDimIdCacheRef.current.get(id);
    }
    const options = CaseDbDataUtil.getColTypeOptionsForRefDimId({
      colsValidationRules: colsValidationRulesQuery.data?.valid_col_types_by_dim_type ?? {},
      colTypeOptions: colTypeOptionsQuery.options,
      refDimId: id,
      refDimMap: refDimMapQuery.map,
    });
    colTypeOptionsByDimIdCacheRef.current.set(id, options);
    return options;
  }, [colTypeOptionsQuery.options, colsValidationRulesQuery.data?.valid_col_types_by_dim_type, refDimMapQuery.map]);

  const onFormChange = useCallback((_item: CaseDbRefCol, values: FormFields, formMethods: UseFormReturn<FormFields>) => {
    if (values.col_type && values.concept_set_id && !CONCEPT_COL_TYPES.includes(values.col_type)) {
      formMethods.setValue('concept_set_id', null);
    }
    if (values.col_type && values.region_set_id && values.col_type !== CaseDbColType.GEO_REGION) {
      formMethods.setValue('region_set_id', null);
    }
    if (values.col_type && values.genetic_distance_protocol_id && values.col_type !== CaseDbColType.GENETIC_DISTANCE) {
      formMethods.setValue('genetic_distance_protocol_id', null);
    }
    if (values.col_type && values.ref_dim_id) {
      const validColOptions = getColTypeOptionsForDimId(values.ref_dim_id);
      if (!validColOptions.find(option => option.value === values.col_type)) {
        formMethods.setValue('col_type', validColOptions.length === 1 ? validColOptions[0].value as CaseDbColType : null);
      }
    }
  }, [getColTypeOptionsForDimId]);


  const formFieldDefinitions = useCallback((item: CaseDbRefCol, values: FormFields): FormFieldDefinition<FormFields>[] => {
    const normalizedRefDimId = values?.ref_dim_id ?? item?.ref_dim_id ?? refDimId ?? null;

    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!item,
        label: t`Reference dimension`,
        name: 'ref_dim_id',
        options: refDimOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!item,
        label: t`Column type`,
        loading: colTypeOptionsQuery.isLoading,
        name: 'col_type',
        options: getColTypeOptionsForDimId(normalizedRefDimId),
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Label`,
        name: 'label',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Column code prefix`,
        name: 'code_suffix',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Concept set`,
        name: 'concept_set_id',
        options: conceptSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Region set`,
        name: 'region_set_id',
        options: regionSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Genetic distance protocol`,
        name: 'genetic_distance_protocol_id',
        options: geneticDistanceProtocolOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Rank`,
        name: 'rank',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Regex`,
        name: 'regex',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Schema URI`,
        name: 'schema_uri',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Schema definition`,
        multiline: true,
        name: 'schema_definition',
        rows: 10,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const satisfies FormFieldDefinition<FormFields>[];
  }, [colTypeOptionsQuery.isLoading, conceptSetOptionsQuery.options, refDimId, refDimOptionsQuery.options, geneticDistanceProtocolOptionsQuery.options, getColTypeOptionsForDimId, regionSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbRefCol>[] => {
    const columns: TableColumn<CaseDbRefCol>[] = [];

    if (!refDimId) {
      columns.push(
        TableUtil.createOptionsColumn<CaseDbRefCol>({ id: 'ref_dim_id', name: t`Reference dimension`, options: refDimOptionsQuery.options }),
      );
    }

    columns.push(
      TableUtil.createTextColumn<CaseDbRefCol>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<CaseDbRefCol>({ id: 'col_type', name: t`Column type`, options: colTypeOptionsQuery.options }),
      TableUtil.createTextColumn<CaseDbRefCol>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<CaseDbRefCol>({ id: 'rank', name: t`Rank` }),
    );

    return columns;
  }, [colTypeOptionsQuery.options, refDimId, refDimOptionsQuery.options, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: CaseDbRefCol): CaseDbRefCol => {
    return {
      id: previousItem.id,
      ref_dim_id: previousItem.ref_dim_id,
      ...variables,
    };
  }, []);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      ref_dim_id: refDimId ?? null,
    };
  }, [refDimId]);

  const title = useMemo(() => {
    const parts: string[] = [];

    if (refDimId && refDimMapQuery.map.has(refDimId)) {
      parts.push(refDimMapQuery.map.get(refDimId)?.code);
    }
    parts.push(t`Reference columns`);

    return parts;
  }, [refDimId, refDimMapQuery.map, t]);

  return (
    <CrudPage<FormFields, CaseDbRefCol>
      createItemDialogTitle={t`Create new reference column`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.RefColCrudCommand}
      defaultNewItem={defaultNewItem}
      defaultSortByField={refDimId ? 'rank' : 'ref_dim_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      loadables={loadables}
      onFormChange={onFormChange}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.REF_COLS}
      schema={schema}
      tableColumns={tableColumns}
      tableStoreStorageNamePostFix={refDimId ? 'RefDim' : undefined}
      testIdAttributes={TestIdUtil.createAttributes('RefColsAdminPage')}
      title={title}
      updateOne={updateOne}
    />
  );
};
