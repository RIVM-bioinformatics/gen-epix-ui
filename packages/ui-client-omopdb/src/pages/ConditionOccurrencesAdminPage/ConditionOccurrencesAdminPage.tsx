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
  OmopDbConditionOccurrence,
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

type FormFields = OmitWithMetaData<OmopDbConditionOccurrence, 'condition_occurrence_id'>;
type Row = { id: string } & OmopDbConditionOccurrence;
const toTableRow = (item: OmopDbConditionOccurrence): Row => {
  return OmopDbAdminUtil.withId(item, 'condition_occurrence_id', 'Condition Occurrence');
};
export const ConditionOccurrencesAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const providerOptionsQuery = useProviderOptionsQuery();
  const visitDetailOptionsQuery = useVisitDetailOptionsQuery();
  const visitOccurrenceOptionsQuery = useVisitOccurrenceOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery, providerOptionsQuery, visitDetailOptionsQuery, visitOccurrenceOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).conditionOccurrencesGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).conditionOccurrencesDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'condition_occurrence_id', 'Condition Occurrence'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'condition_occurrence_id', 'Condition Occurrence');
    const response = await container.resolve(OmopDbOmopApi).conditionOccurrencesPutOne(id, { ...variables, condition_occurrence_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).conditionOccurrencesPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const conditionSourceValue = item.condition_source_value;
    if (typeof conditionSourceValue === 'string' && conditionSourceValue.trim().length > 0) {
      return conditionSourceValue;
    }
    if (typeof conditionSourceValue === 'number') {
      return String(conditionSourceValue);
    }
    const conditionStatusSourceValue = item.condition_status_source_value;
    if (typeof conditionStatusSourceValue === 'string' && conditionStatusSourceValue.trim().length > 0) {
      return conditionStatusSourceValue;
    }
    if (typeof conditionStatusSourceValue === 'number') {
      return String(conditionStatusSourceValue);
    }
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
    const conditionConceptId = item.condition_concept_id;
    if (typeof conditionConceptId === 'string' && conditionConceptId.length > 0) {
      const conditionConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === conditionConceptId);
      if (conditionConceptIdOption?.label) {
        return conditionConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = conditionConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New condition occurrence`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      condition_concept_id: string().required(),
      condition_end_date: string().nullable().notRequired(),
      condition_end_datetime: string().nullable().notRequired(),
      condition_end_iso_interval: string().nullable().notRequired(),
      condition_source_concept_id: string().nullable().notRequired(),
      condition_source_value: string().nullable().notRequired(),
      condition_start_date: string().required(),
      condition_start_datetime: string().nullable().notRequired(),
      condition_start_iso_interval: string().nullable().notRequired(),
      condition_status_concept_id: string().nullable().notRequired(),
      condition_status_source_value: string().nullable().notRequired(),
      condition_type_concept_id: string().required(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      provider_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      stop_reason: string().nullable().notRequired(),
      visit_detail_id: string().nullable().notRequired(),
      visit_occurrence_id: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Condition Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'condition_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Condition Start Date`, name: 'condition_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Condition Start Datetime`, name: 'condition_start_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Condition End Date`, name: 'condition_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Condition End Datetime`, name: 'condition_end_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Condition Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'condition_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Condition Status Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'condition_status_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Stop Reason`, name: 'stop_reason' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provider ID`, loading: providerOptionsQuery.isLoading, name: 'provider_id', options: providerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Occurrence ID`, loading: visitOccurrenceOptionsQuery.isLoading, name: 'visit_occurrence_id', options: visitOccurrenceOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Detail ID`, loading: visitDetailOptionsQuery.isLoading, name: 'visit_detail_id', options: visitDetailOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Condition Source Value`, name: 'condition_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Condition Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'condition_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Condition Status Source Value`, name: 'condition_status_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Condition Start ISO Interval`, name: 'condition_start_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Condition End ISO Interval`, name: 'condition_end_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, providerOptionsQuery.isLoading, visitDetailOptionsQuery.isLoading, visitOccurrenceOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'condition_concept_id', name: t`Condition Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'condition_start_date', name: t`Condition Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'condition_start_datetime', name: t`Condition Start Datetime` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'condition_end_date', name: t`Condition End Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'condition_end_datetime', name: t`Condition End Datetime` }),
      TableUtil.createOptionsColumn<Row>({ id: 'condition_type_concept_id', name: t`Condition Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'condition_status_concept_id', name: t`Condition Status Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'stop_reason', name: t`Stop Reason` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provider_id', name: t`Provider ID`, options: providerOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_occurrence_id', name: t`Visit Occurrence ID`, options: visitOccurrenceOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_detail_id', name: t`Visit Detail ID`, options: visitDetailOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'condition_source_value', name: t`Condition Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'condition_source_concept_id', name: t`Condition Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'condition_status_source_value', name: t`Condition Status Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'condition_start_iso_interval', name: t`Condition Start ISO Interval` }),
      TableUtil.createTextColumn<Row>({ id: 'condition_end_iso_interval', name: t`Condition End ISO Interval` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new condition occurrence`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ConditionOccurrenceCrudCommand}
      defaultSortByField={'condition_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Condition Occurrence`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CONDITION_OCCURRENCES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConditionOccurrencesAdminPage')}
      title={t`Condition Occurrences`}
      updateOne={updateOne}
    />
  );
};
