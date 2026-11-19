import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type {
  OmopDbApiPermission,
  OmopDbMeasurementRelation,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbOmopApi,
} from '@gen-epix/api-omopdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { useMeasurementOptionsQuery } from '../../dataHooks/useMeasurementQuery';
import { usePersonOptionsQuery } from '../../dataHooks/usePersonQuery';

type FormFields = OmitWithMetaData<OmopDbMeasurementRelation, 'measurement_relation_id'>;
type Row = { id: string } & OmopDbMeasurementRelation;
const toTableRow = (item: OmopDbMeasurementRelation): Row => {
  return OmopDbAdminUtil.withId(item, 'measurement_relation_id', 'Measurement Relation');
};
export const MeasurementRelationsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const measurementOptionsQuery = useMeasurementOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, measurementOptionsQuery, personOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).measurementRelationsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).measurementRelationsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'measurement_relation_id', 'Measurement Relation'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'measurement_relation_id', 'Measurement Relation');
    const response = await container.resolve(OmopDbOmopApi).measurementRelationsPutOne(id, { ...variables, measurement_relation_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).measurementRelationsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const personId = item.person_id;
    if (typeof personId === 'string' && personId.length > 0) {
      const personIdOption = personOptionsQuery.options.find(candidate => candidate.value === personId);
      if (personIdOption?.label) {
        return personIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    const fromMeasurementId = item.from_measurement_id;
    if (typeof fromMeasurementId === 'string' && fromMeasurementId.length > 0) {
      const fromMeasurementIdOption = measurementOptionsQuery.options.find(candidate => candidate.value === fromMeasurementId);
      if (fromMeasurementIdOption?.label) {
        return fromMeasurementIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = fromMeasurementId;
      }
    }
    const toMeasurementId = item.to_measurement_id;
    if (typeof toMeasurementId === 'string' && toMeasurementId.length > 0) {
      const toMeasurementIdOption = measurementOptionsQuery.options.find(candidate => candidate.value === toMeasurementId);
      if (toMeasurementIdOption?.label) {
        return toMeasurementIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = toMeasurementId;
      }
    }
    const measurementRelationConceptId = item.measurement_relation_concept_id;
    if (typeof measurementRelationConceptId === 'string' && measurementRelationConceptId.length > 0) {
      const measurementRelationConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === measurementRelationConceptId);
      if (measurementRelationConceptIdOption?.label) {
        return measurementRelationConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = measurementRelationConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New measurement relation`;
  }, [personOptionsQuery.options, measurementOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      from_measurement_id: string().required(),
      measurement_relation_concept_id: string().nullable().notRequired(),
      person_id: string().required(),
      to_measurement_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`From Measurement ID`, loading: measurementOptionsQuery.isLoading, name: 'from_measurement_id', options: measurementOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`To Measurement ID`, loading: measurementOptionsQuery.isLoading, name: 'to_measurement_id', options: measurementOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Measurement Relation Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'measurement_relation_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, measurementOptionsQuery.isLoading, personOptionsQuery.isLoading, conceptOptionsQuery.options, measurementOptionsQuery.options, personOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'from_measurement_id', name: t`From Measurement ID`, options: measurementOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'to_measurement_id', name: t`To Measurement ID`, options: measurementOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'measurement_relation_concept_id', name: t`Measurement Relation Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, measurementOptionsQuery.options, personOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new measurement relation`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.MeasurementRelationCrudCommand}
      defaultSortByField={'person_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Measurement Relation`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.MEASUREMENT_RELATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('MeasurementRelationsAdminPage')}
      title={t`Measurement Relations`}
      updateOne={updateOne}
    />
  );
};
