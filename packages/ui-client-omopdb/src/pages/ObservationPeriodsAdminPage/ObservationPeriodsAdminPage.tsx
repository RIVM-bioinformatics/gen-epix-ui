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
  OmopDbObservationPeriod,
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

type FormFields = OmitWithMetaData<OmopDbObservationPeriod, 'observation_period_id'>;
type Row = { id: string } & OmopDbObservationPeriod;
const toTableRow = (item: OmopDbObservationPeriod): Row => {
  return OmopDbAdminUtil.withId(item, 'observation_period_id', 'Observation Period');
};
export const ObservationPeriodsAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).observationPeriodsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).observationPeriodsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'observation_period_id', 'Observation Period'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'observation_period_id', 'Observation Period');
    const response = await container.resolve(OmopDbOmopApi).observationPeriodsPutOne(id, { ...variables, observation_period_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).observationPeriodsPostOne(variables);
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
      /* v8 ignore else -- person is the first reference checked, so fallbackValue is always unset here */
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    const periodTypeConceptId = item.period_type_concept_id;
    if (typeof periodTypeConceptId === 'string' && periodTypeConceptId.length > 0) {
      const periodTypeConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === periodTypeConceptId);
      if (periodTypeConceptIdOption?.label) {
        return periodTypeConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = periodTypeConceptId;
      }
    }
    const providedByOrganizationId = item.provided_by_organization_id;
    if (typeof providedByOrganizationId === 'string' && providedByOrganizationId.length > 0) {
      const providedByOrganizationIdOption = organizationOptionsQuery.options.find(candidate => candidate.value === providedByOrganizationId);
      if (providedByOrganizationIdOption?.label) {
        return providedByOrganizationIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = providedByOrganizationId;
      }
    }
    const provenanceId = item.provenance_id;
    if (typeof provenanceId === 'string' && provenanceId.trim().length > 0) {
      return provenanceId;
    }
    if (typeof provenanceId === 'number') {
      return String(provenanceId);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- a create item always has a non-empty person_id (yup required), so fallbackValue is set */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable: rows always have an id, and create items always set fallbackValue via person_id */
    return t`New observation period`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, organizationOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      observation_period_end_date: SchemaUtil.isoString.required(),
      observation_period_end_iso_interval: string().nullable().notRequired(),
      observation_period_start_date: SchemaUtil.isoString.required(),
      observation_period_start_iso_interval: string().nullable().notRequired(),
      period_type_concept_id: string().required(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Observation Period Start Date`, name: 'observation_period_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Observation Period End Date`, name: 'observation_period_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Period Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'period_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Observation Period Start ISO Interval`, name: 'observation_period_start_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Observation Period End ISO Interval`, name: 'observation_period_end_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'observation_period_start_date', name: t`Observation Period Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'observation_period_end_date', name: t`Observation Period End Date` }),
      TableUtil.createOptionsColumn<Row>({ id: 'period_type_concept_id', name: t`Period Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'observation_period_start_iso_interval', name: t`Observation Period Start ISO Interval` }),
      TableUtil.createTextColumn<Row>({ id: 'observation_period_end_iso_interval', name: t`Observation Period End ISO Interval` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new observation period`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ObservationPeriodCrudCommand}
      defaultSortByField={'person_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Observation Period`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.OBSERVATION_PERIODS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ObservationPeriodsAdminPage')}
      title={t`Observation Periods`}
      updateOne={updateOne}
    />
  );
};
