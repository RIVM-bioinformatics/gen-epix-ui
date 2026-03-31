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

import type { RefCol } from '../../api';
import {
  CaseApi,
  ColType,
  CommandName,
} from '../../api';
import { useColTypeOptionsQuery } from '../../dataHooks/useColTypesQuery';
import { useConceptSetOptionsQuery } from '../../dataHooks/useConceptSetsQuery';
import {
  useRefDimMapQuery,
  useRefDimOptionsQuery,
} from '../../dataHooks/useRefDimsQuery';
import { useGeneticDistanceProtocolOptionsQuery } from '../../dataHooks/useGeneticDistanceProtocolsQuery';
import { useRegionSetOptionsQuery } from '../../dataHooks/useRegionSetsQuery';
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
import { useRefColsValidationRulesQuery } from '../../dataHooks/useRefColsValidationRulesQuery';
import { DataUtil } from '../../utils/DataUtil';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<RefCol, 'ref_dim' | 'concept_set' | 'region_set' | 'genetic_distance_protocol' | 'props'>;

const CONCEPT_COL_TYPES: ColType[] = [ColType.NOMINAL, ColType.ORDINAL, ColType.INTERVAL];

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
  const colTypeOptionsByDimIdCache = useRef(new Map<string, OptionBase<string>[]>());

  const loadables = useArray([refDimMapQuery, refDimOptionsQuery, colTypeOptionsQuery, conceptSetOptionsQuery, regionSetOptionsQuery, geneticDistanceProtocolOptionsQuery, colsValidationRulesQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.refColsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((refCols: RefCol[]) => {
    if (refDimId) {
      return refCols.filter((refCol) => refCol.ref_dim_id === refDimId);
    }
    return refCols;
  }, [refDimId]);

  const deleteOne = useCallback(async (item: RefCol) => {
    return await CaseApi.instance.refColsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RefCol) => {
    return (await CaseApi.instance.refColsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.refColsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: RefCol) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: SchemaUtil.label,
      code: SchemaUtil.code,
      code_suffix: string().alphaNumeric().required().max(100),
      rank: SchemaUtil.rank,
      ref_dim_id: string().uuid4().required().max(100),
      col_type: mixed<ColType>().required().oneOf(Object.values(ColType)),
      description: SchemaUtil.description,
      concept_set_id: string().when('col_type', {
        is: (colType: ColType) => CONCEPT_COL_TYPES.includes(colType),
        then: () => string().uuid4().required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      region_set_id: string().when('col_type', {
        is: (col_type: ColType) => col_type === ColType.GEO_REGION,
        then: () => string().uuid4().required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      genetic_distance_protocol_id: string().when('col_type', {
        is: (col_type: ColType) => col_type === ColType.GENETIC_DISTANCE,
        then: () => string().uuid4().required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      regex: string().when('col_type', {
        is: (col_type: ColType) => col_type === ColType.REGULAR_LANGUAGE,
        then: () => string().regex().max(500).required(),
        otherwise: () => string().regex().max(500).nullable().notRequired(),
      }),
      schema_definition: string().when('col_type', {
        is: (col_type: ColType) => ([ColType.CONTEXT_FREE_GRAMMAR_JSON, ColType.CONTEXT_FREE_GRAMMAR_XML] as ColType[]).includes(col_type),
        then: () => string().freeFormText().max(10000).required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      schema_uri: string().when('col_type', {
        is: (col_type: ColType) => ([ColType.CONTEXT_FREE_GRAMMAR_JSON, ColType.CONTEXT_FREE_GRAMMAR_XML] as ColType[]).includes(col_type),
        then: () => string().url().max(1000).required(),
        otherwise: () => string().url().max(1000).nullable().notRequired(),
      }),
    });
  }, []);

  const getColTypeOptionsForDimId = useCallback((id: string): OptionBase<string>[] => {
    if (colTypeOptionsByDimIdCache.current.has(id)) {
      return colTypeOptionsByDimIdCache.current.get(id);
    }
    const options = DataUtil.getColTypeOptionsForRefDimId({
      refDimId: id,
      refDimMap: refDimMapQuery.map,
      colTypeOptions: colTypeOptionsQuery.options,
      colsValidationRules: colsValidationRulesQuery.data?.valid_col_types_by_dim_type ?? {},
    });
    colTypeOptionsByDimIdCache.current.set(id, options);
    return options;
  }, [colTypeOptionsQuery.options, colsValidationRulesQuery.data?.valid_col_types_by_dim_type, refDimMapQuery.map]);

  const onFormChange = useCallback((_item: RefCol, values: FormFields, formMethods: UseFormReturn<FormFields>) => {
    if (values.col_type && values.concept_set_id && !CONCEPT_COL_TYPES.includes(values.col_type)) {
      formMethods.setValue('concept_set_id', null);
    }
    if (values.col_type && values.region_set_id && values.col_type !== ColType.GEO_REGION) {
      formMethods.setValue('region_set_id', null);
    }
    if (values.col_type && values.genetic_distance_protocol_id && values.col_type !== ColType.GENETIC_DISTANCE) {
      formMethods.setValue('genetic_distance_protocol_id', null);
    }
    if (values.col_type && values.ref_dim_id) {
      const validColOptions = getColTypeOptionsForDimId(values.ref_dim_id);
      if (!validColOptions.find(option => option.value === values.col_type)) {
        formMethods.setValue('col_type', validColOptions.length === 1 ? validColOptions[0].value as ColType : null);
      }
    }
  }, [getColTypeOptionsForDimId]);


  const formFieldDefinitions = useCallback((item: RefCol, values: FormFields): FormFieldDefinition<FormFields>[] => {
    const normalizedRefDimId = values?.ref_dim_id ?? item?.ref_dim_id ?? refDimId ?? null;

    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'ref_dim_id',
        label: t`Reference dimension`,
        options: refDimOptionsQuery.options,
        disabled: !!item,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'col_type',
        label: t`Column type`,
        options: getColTypeOptionsForDimId(normalizedRefDimId),
        loading: colTypeOptionsQuery.isLoading,
        disabled: !!item,
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
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code_suffix',
        label: t`Column code prefix`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'concept_set_id',
        label: t`Concept set`,
        options: conceptSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'region_set_id',
        label: t`Region set`,
        options: regionSetOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'genetic_distance_protocol_id',
        label: t`Genetic distance protocol`,
        options: geneticDistanceProtocolOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'regex',
        label: t`Regex`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'schema_uri',
        label: t`Schema URI`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'schema_definition',
        label: t`Schema definition`,
        multiline: true,
        rows: 10,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const satisfies FormFieldDefinition<FormFields>[];
  }, [colTypeOptionsQuery.isLoading, conceptSetOptionsQuery.options, refDimId, refDimOptionsQuery.options, geneticDistanceProtocolOptionsQuery.options, getColTypeOptionsForDimId, regionSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<RefCol>[] => {
    const columns: TableColumn<RefCol>[] = [];

    if (!refDimId) {
      columns.push(
        TableUtil.createOptionsColumn<RefCol>({ id: 'ref_dim_id', name: t`Reference dimension`, options: refDimOptionsQuery.options }),
      );
    }

    columns.push(
      TableUtil.createTextColumn<RefCol>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<RefCol>({ id: 'col_type', name: t`Column type`, options: colTypeOptionsQuery.options }),
      TableUtil.createTextColumn<RefCol>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<RefCol>({ id: 'rank', name: t`Rank` }),
    );

    return columns;
  }, [colTypeOptionsQuery.options, refDimId, refDimOptionsQuery.options, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: RefCol): RefCol => {
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
    <CrudPage<FormFields, RefCol>
      createItemDialogTitle={t`Create new reference column`}
      createOne={createOne}
      crudCommandType={CommandName.RefColCrudCommand}
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
      resourceQueryKeyBase={QUERY_KEY.REF_COLS}
      schema={schema}
      tableColumns={tableColumns}
      tableStoreStorageNamePostFix={refDimId ? 'RefDim' : undefined}
      testIdAttributes={TestIdUtil.createAttributes('RefColsAdminPage')}
      title={title}
      updateOne={updateOne}
      onFormChange={onFormChange}
    />
  );
};
