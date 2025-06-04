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
import { useColTypeOptions } from '../../dataHooks/useColTypes';
import { useConceptSetOptions } from '../../dataHooks/useConceptSets';
import { useDimOptions } from '../../dataHooks/useDims';
import { useGeneticDistanceProtocolOptions } from '../../dataHooks/useGeneticDistanceProtocols';
import { useRegionSetOptions } from '../../dataHooks/useRegionSets';
import type { Loadable } from '../../models/dataHooks';
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
  const dimOptions = useDimOptions();
  const colTypeOptions = useColTypeOptions();
  const conceptSetOptions = useConceptSetOptions();
  const regionSetOptions = useRegionSetOptions();
  const geneticDistanceProtocolOptions = useGeneticDistanceProtocolOptions();

  const loadables = useMemo<Loadable[]>(() => [dimOptions, colTypeOptions, conceptSetOptions, regionSetOptions, geneticDistanceProtocolOptions], [colTypeOptions, conceptSetOptions, dimOptions, geneticDistanceProtocolOptions, regionSetOptions]);

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
        options: colTypeOptions.options,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'label',
        label: t`Label`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code_suffix',
        label: t`Column code prefix`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'dim_id',
        label: t`Dimension`,
        options: dimOptions.options,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'concept_set_id',
        label: t`Concept set`,
        options: conceptSetOptions.options,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'region_set_id',
        label: t`Region set`,
        options: regionSetOptions.options,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'genetic_distance_protocol_id',
        label: t`Genetic distance protocol`,
        options: geneticDistanceProtocolOptions.options,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank_in_dim',
        label: t`Rank in dimension`,
        type: 'number',
      },


    ];
  }, [colTypeOptions.options, conceptSetOptions.options, dimOptions.options, geneticDistanceProtocolOptions.options, regionSetOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<Col>[] => {
    return [
      TableUtil.createTextColumn<Col>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<Col>({ id: 'dim_id', name: t`Dimension`, options: dimOptions.options }),
      TableUtil.createOptionsColumn<Col>({ id: 'col_type', name: t`Column type`, options: colTypeOptions.options }),
      TableUtil.createTextColumn<Col>({ id: 'rank_in_dim', name: t`Rank in dimension` }),
      TableUtil.createTextColumn<Col>({ id: 'label', name: t`Label` }),
    ];
  }, [colTypeOptions.options, dimOptions.options, t]);

  return (
    <CrudPage<FormFields, Col>
      createOne={createOne}
      crudCommandType={CommandName.ColCrudCommand}
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
