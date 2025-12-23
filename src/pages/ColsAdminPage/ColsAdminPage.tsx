import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  number,
  object,
  string,
} from 'yup';
import { useParams } from 'react-router-dom';
import type { UseFormReturn } from 'react-hook-form';

import type { Col } from '../../api';
import {
  CaseApi,
  ColType,
  CommandName,
} from '../../api';
import { useColTypeOptionsQuery } from '../../dataHooks/useColTypesQuery';
import { useConceptSetOptionsQuery } from '../../dataHooks/useConceptSetsQuery';
import {
  useDimMapQuery,
  useDimOptionsQuery,
} from '../../dataHooks/useDimsQuery';
import { useGeneticDistanceProtocolOptionsQuery } from '../../dataHooks/useGeneticDistanceProtocolsQuery';
import { useRegionSetOptionsQuery } from '../../dataHooks/useRegionSetsQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { useColsValidationRulesQuery } from '../../dataHooks/useColsValidationRulesQuery';

type FormFields = Pick<Col, 'dim_id' | 'code_suffix' | 'code' | 'rank' | 'label' | 'col_type' | 'concept_set_id' | 'region_set_id' | 'genetic_distance_protocol_id' | 'description'>;

const CONCEPT_COL_TYPES: ColType[] = [ColType.NOMINAL, ColType.ORDINAL, ColType.INTERVAL];

export const ColsAdminPage = () => {
  const { dimId } = useParams();
  const [t] = useTranslation();
  const dimOptionsQuery = useDimOptionsQuery();
  const dimMapQuery = useDimMapQuery();
  const colTypeOptionsQuery = useColTypeOptionsQuery();
  const conceptSetOptionsQuery = useConceptSetOptionsQuery();
  const regionSetOptionsQuery = useRegionSetOptionsQuery();
  const geneticDistanceProtocolOptionsQuery = useGeneticDistanceProtocolOptionsQuery();
  const colsValidationRulesQuery = useColsValidationRulesQuery();

  const loadables = useArray([dimMapQuery, dimOptionsQuery, colTypeOptionsQuery, conceptSetOptionsQuery, regionSetOptionsQuery, geneticDistanceProtocolOptionsQuery, colsValidationRulesQuery]);

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

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      code_suffix: string().alphaNumeric().required().max(100),
      rank: number().integer().positive().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      dim_id: string().uuid4().required().max(100),
      col_type: mixed<ColType>().required().oneOf(Object.values(ColType)),
      description: string().freeFormText().required().max(100),
      concept_set_id: string().uuid4().when('col_type', {
        is: (colType: ColType) => CONCEPT_COL_TYPES.includes(colType),
        then: () => string().required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      region_set_id: string().uuid4().when('col_type', {
        is: (col_type: ColType) => col_type === ColType.GEO_REGION,
        then: () => string().required(),
        otherwise: () => string().nullable().notRequired(),
      }),
      genetic_distance_protocol_id: string().uuid4().when('col_type', {
        is: (col_type: ColType) => col_type === ColType.GENETIC_DISTANCE,
        then: () => string().required(),
        otherwise: () => string().nullable().notRequired(),
      }),
    });
  }, []);

  const onFormChange = useCallback((_item: Col, values: FormFields, formMethods: UseFormReturn<FormFields>) => {
    // Example: You can perform side effects here when the form changes
    if (values.col_type && values.concept_set_id && !CONCEPT_COL_TYPES.includes(values.col_type)) {
      formMethods.setValue('concept_set_id', null);
    }
    if (values.col_type && values.region_set_id && values.col_type !== ColType.GEO_REGION) {
      formMethods.setValue('region_set_id', null);
    }
    if (values.col_type && values.genetic_distance_protocol_id && values.col_type !== ColType.GENETIC_DISTANCE) {
      formMethods.setValue('genetic_distance_protocol_id', null);
    }
  }, []);

  const formFieldDefinitions = useCallback((item: Col, values?: FormFields): FormFieldDefinition<FormFields>[] => {
    const sanitizedDimId = dimId ?? item?.dim_id ?? values?.dim_id;
    const dim = sanitizedDimId ? dimMapQuery.map.get(sanitizedDimId) : null;
    const colTypeOptions = dim ? colTypeOptionsQuery.options.filter(option => {
      return colsValidationRulesQuery.data?.valid_col_types_by_dim_type[dim.dim_type].includes(option.value as ColType);
    }) : colTypeOptionsQuery.options;

    const definitions: FormFieldDefinition<FormFields>[] = [];

    if (!dimId) {
      definitions.push(
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'dim_id',
        label: t`Dimension`,
        options: dimOptionsQuery.options,
        disabled: !!item,
      } as const satisfies FormFieldDefinition<FormFields>,
      );
    }

    definitions.push(
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'col_type',
        label: t`Column type`,
        options: colTypeOptions,
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
    );

    return definitions;
  }, [colTypeOptionsQuery.isLoading, colTypeOptionsQuery.options, colsValidationRulesQuery.data?.valid_col_types_by_dim_type, conceptSetOptionsQuery.options, dimId, dimMapQuery.map, dimOptionsQuery.options, geneticDistanceProtocolOptionsQuery.options, regionSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<Col>[] => {
    const columns: TableColumn<Col>[] = [];

    if (!dimId) {
      columns.push(
        TableUtil.createOptionsColumn<Col>({ id: 'dim_id', name: t`Dimension`, options: dimOptionsQuery.options }),
      );
    }

    columns.push(
      TableUtil.createTextColumn<Col>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<Col>({ id: 'col_type', name: t`Column type`, options: colTypeOptionsQuery.options }),
      TableUtil.createTextColumn<Col>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<Col>({ id: 'rank', name: t`Rank` }),
    );

    return columns;
  }, [colTypeOptionsQuery.options, dimId, dimOptionsQuery.options, t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: Col): Col => {
    return {
      id: previousItem.id,
      dim_id: previousItem.dim_id,
      ...variables,
    };
  }, []);

  const defaultNewItem = useMemo<Partial<FormFields>>(() => {
    return {
      dim_id: dimId ?? null,
    };
  }, [dimId]);

  const title = useMemo(() => {
    if (dimId && dimMapQuery.map.has(dimId)) {
      return t('{{dim}} → Columns', { dim: dimMapQuery.map.get(dimId)?.code });
    }

    return t`Columns`;
  }, [dimId, dimMapQuery.map, t]);

  return (
    <CrudPage<FormFields, Col>
      createOne={createOne}
      crudCommandType={CommandName.ColCrudCommand}
      createItemDialogTitle={t`Create new column`}
      defaultSortByField={dimId ? 'rank' : 'dim_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      defaultNewItem={defaultNewItem}
      tableStoreStorageNamePostFix={dimId ? `Dim` : undefined}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      fetchAllSelect={fetchAllSelect}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.COLS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ColsAdminPage')}
      title={title}
      updateOne={updateOne}
      onFormChange={onFormChange}
    />
  );
};
