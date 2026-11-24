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
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';
import type {
  OmopDbApiPermission,
  OmopDbObservation,
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
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';
import { useOrganizationOptionsQuery } from '@gen-epix/ui-client-common/dataHooks/useOrganizationsQuery';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { usePersonOptionsQuery } from '../../dataHooks/usePersonQuery';
import { useProviderOptionsQuery } from '../../dataHooks/useProviderQuery';
import { useVisitDetailOptionsQuery } from '../../dataHooks/useVisitDetailQuery';
import { useVisitOccurrenceOptionsQuery } from '../../dataHooks/useVisitOccurrenceQuery';

type FormFields = OmitWithMetaData<OmopDbObservation, 'observation_id'>;
type Row = { id: string } & OmopDbObservation;
const toTableRow = (item: OmopDbObservation): Row => {
  return OmopDbAdminUtil.withId(item, 'observation_id', 'Observation');
};
export const ObservationsAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const providerOptionsQuery = useProviderOptionsQuery();
  const visitDetailOptionsQuery = useVisitDetailOptionsQuery();
  const visitOccurrenceOptionsQuery = useVisitOccurrenceOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery, providerOptionsQuery, visitDetailOptionsQuery, visitOccurrenceOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).observationsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).observationsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'observation_id', 'Observation'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'observation_id', 'Observation');
    const response = await container.resolve(OmopDbOmopApi).observationsPutOne(id, { ...variables, observation_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).observationsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    const observationSourceValue = item.observation_source_value;
    if (typeof observationSourceValue === 'string' && observationSourceValue.trim().length > 0) {
      return observationSourceValue;
    }
    if (typeof observationSourceValue === 'number') {
      return String(observationSourceValue);
    }
    const unitSourceValue = item.unit_source_value;
    if (typeof unitSourceValue === 'string' && unitSourceValue.trim().length > 0) {
      return unitSourceValue;
    }
    if (typeof unitSourceValue === 'number') {
      return String(unitSourceValue);
    }
    const qualifierSourceValue = item.qualifier_source_value;
    if (typeof qualifierSourceValue === 'string' && qualifierSourceValue.trim().length > 0) {
      return qualifierSourceValue;
    }
    if (typeof qualifierSourceValue === 'number') {
      return String(qualifierSourceValue);
    }
    const valueSourceValue = item.value_source_value;
    if (typeof valueSourceValue === 'string' && valueSourceValue.trim().length > 0) {
      return valueSourceValue;
    }
    if (typeof valueSourceValue === 'number') {
      return String(valueSourceValue);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    return t`New observation`;
  }, [t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      obs_event_field_concept_id: string().nullable().notRequired(),
      observation_concept_id: string().required(),
      observation_date: SchemaUtil.isoString.required(),
      observation_datetime: SchemaUtil.isoString.nullable().notRequired(),
      observation_event_id: string().nullable().notRequired(),
      observation_iso_interval: string().nullable().notRequired(),
      observation_source_concept_id: string().nullable().notRequired(),
      observation_source_value: string().nullable().notRequired(),
      observation_type_concept_id: string().required(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      provider_id: string().nullable().notRequired(),
      qualifier_concept_id: string().nullable().notRequired(),
      qualifier_source_value: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      unit_concept_id: string().nullable().notRequired(),
      unit_source_value: string().nullable().notRequired(),
      value_as_concept_id: string().nullable().notRequired(),
      value_as_iso_interval: string().nullable().notRequired(),
      value_as_number: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      value_as_string: string().nullable().notRequired(),
      value_source_value: string().nullable().notRequired(),
      visit_detail_id: string().nullable().notRequired(),
      visit_occurrence_id: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Observation Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'observation_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Observation Date`, name: 'observation_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Observation Datetime`, name: 'observation_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Observation Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'observation_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Value As Number`, name: 'value_as_number', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Value As String`, name: 'value_as_string' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Value As Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'value_as_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Qualifier Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'qualifier_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Unit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'unit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provider ID`, loading: providerOptionsQuery.isLoading, name: 'provider_id', options: providerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Occurrence ID`, loading: visitOccurrenceOptionsQuery.isLoading, name: 'visit_occurrence_id', options: visitOccurrenceOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Detail ID`, loading: visitDetailOptionsQuery.isLoading, name: 'visit_detail_id', options: visitDetailOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Observation Source Value`, name: 'observation_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Observation Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'observation_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Unit Source Value`, name: 'unit_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Qualifier Source Value`, name: 'qualifier_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Value Source Value`, name: 'value_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Observation Event ID`, name: 'observation_event_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Obs Event Field Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'obs_event_field_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Observation ISO Interval`, name: 'observation_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Value As ISO Interval`, name: 'value_as_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, providerOptionsQuery.isLoading, visitDetailOptionsQuery.isLoading, visitOccurrenceOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'observation_concept_id', name: t`Observation Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'observation_date', name: t`Observation Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'observation_datetime', name: t`Observation Datetime` }),
      TableUtil.createOptionsColumn<Row>({ id: 'observation_type_concept_id', name: t`Observation Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'value_as_number', name: t`Value As Number` }),
      TableUtil.createTextColumn<Row>({ id: 'value_as_string', name: t`Value As String` }),
      TableUtil.createOptionsColumn<Row>({ id: 'value_as_concept_id', name: t`Value As Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'qualifier_concept_id', name: t`Qualifier Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'unit_concept_id', name: t`Unit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provider_id', name: t`Provider ID`, options: providerOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_occurrence_id', name: t`Visit Occurrence ID`, options: visitOccurrenceOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_detail_id', name: t`Visit Detail ID`, options: visitDetailOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'observation_source_value', name: t`Observation Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'observation_source_concept_id', name: t`Observation Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'unit_source_value', name: t`Unit Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'qualifier_source_value', name: t`Qualifier Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'value_source_value', name: t`Value Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'observation_event_id', name: t`Observation Event ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'obs_event_field_concept_id', name: t`Obs Event Field Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'observation_iso_interval', name: t`Observation ISO Interval` }),
      TableUtil.createTextColumn<Row>({ id: 'value_as_iso_interval', name: t`Value As ISO Interval` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new observation`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ObservationCrudCommand}
      defaultSortByField={'observation_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Observation`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.OBSERVATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ObservationsAdminPage')}
      title={t`Observations`}
      updateOne={updateOne}
    />
  );
};
