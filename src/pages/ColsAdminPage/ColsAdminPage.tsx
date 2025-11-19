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

import type { Col } from '../../api';
import {
  CaseApi,
  ColType,
  CommandName,
} from '../../api';
import { useColTypeOptionsQuery } from '../../dataHooks/useColTypesQuery';
import { useConceptSetOptionsQuery } from '../../dataHooks/useConceptSetsQuery';
import { useDimOptionsQuery } from '../../dataHooks/useDimsQuery';
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

type FormFields = Pick<Col, 'dim_id' | 'code_suffix' | 'code' | 'rank_in_dim' | 'label' | 'col_type' | 'concept_set_id' | 'region_set_id' | 'genetic_distance_protocol_id' | 'description'>;

export const ColsAdminPage = () => {
  const [t] = useTranslation();
  const dimOptionsQuery = useDimOptionsQuery();
  const colTypeOptionsQuery = useColTypeOptionsQuery();
  const conceptSetOptionsQuery = useConceptSetOptionsQuery();
  const regionSetOptionsQuery = useRegionSetOptionsQuery();
  const geneticDistanceProtocolOptionsQuery = useGeneticDistanceProtocolOptionsQuery();

  const loadables = useArray([dimOptionsQuery, colTypeOptionsQuery, conceptSetOptionsQuery, regionSetOptionsQuery, geneticDistanceProtocolOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.getInstance().colsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Col) => {
    return await CaseApi.getInstance().colsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Col) => {
    return (await CaseApi.getInstance().colsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.getInstance().colsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Col) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      code_suffix: string().alphaNumeric().required().max(100),
      rank_in_dim: number().integer().positive().max(10000).optional().transform((val: number, orig) => orig === '' ? undefined : val),
      dim_id: string().uuid4().required().max(100),
      col_type: mixed<ColType>().required().oneOf(Object.values(ColType)),
      description: string().freeFormText().required().max(100),
      concept_set_id: string().uuid4().when('col_type', {
        is: (colType: ColType) => ([ColType.NOMINAL, ColType.ORDINAL, ColType.INTERVAL] as ColType[]).includes(colType),
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

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'col_type',
        label: t`Column type`,
        options: colTypeOptionsQuery.options,
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
        name: 'dim_id',
        label: t`Dimension`,
        options: dimOptionsQuery.options,
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
        name: 'rank_in_dim',
        label: t`Rank in dimension`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [colTypeOptionsQuery.options, conceptSetOptionsQuery.options, dimOptionsQuery.options, geneticDistanceProtocolOptionsQuery.options, regionSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<Col>[] => {
    return [
      TableUtil.createTextColumn<Col>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<Col>({ id: 'dim_id', name: t`Dimension`, options: dimOptionsQuery.options }),
      TableUtil.createOptionsColumn<Col>({ id: 'col_type', name: t`Column type`, options: colTypeOptionsQuery.options }),
      TableUtil.createTextColumn<Col>({ id: 'rank_in_dim', name: t`Rank in dimension` }),
      TableUtil.createTextColumn<Col>({ id: 'label', name: t`Label` }),
    ];
  }, [colTypeOptionsQuery.options, dimOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, Col>
      createOne={createOne}
      crudCommandType={CommandName.ColCrudCommand}
      createItemDialogTitle={t`Create new column`}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.COLS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ColsAdminPage')}
      title={t`Columns`}
      updateOne={updateOne}
    />
  );
};
