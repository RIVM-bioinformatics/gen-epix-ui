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
  OmopDbVisitOccurrence,
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
import { useCareSiteOptionsQuery } from '../../dataHooks/useCareSiteQuery';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { usePersonOptionsQuery } from '../../dataHooks/usePersonQuery';
import { useProviderOptionsQuery } from '../../dataHooks/useProviderQuery';
import { useVisitOccurrenceOptionsQuery } from '../../dataHooks/useVisitOccurrenceQuery';

type FormFields = OmitWithMetaData<OmopDbVisitOccurrence, 'visit_occurrence_id'>;
type Row = { id: string } & OmopDbVisitOccurrence;
const toTableRow = (item: OmopDbVisitOccurrence): Row => {
  return OmopDbAdminUtil.withId(item, 'visit_occurrence_id', 'Visit Occurrence');
};
export const VisitOccurrencesAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const careSiteOptionsQuery = useCareSiteOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const providerOptionsQuery = useProviderOptionsQuery();
  const visitOccurrenceOptionsQuery = useVisitOccurrenceOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, careSiteOptionsQuery, conceptOptionsQuery, personOptionsQuery, providerOptionsQuery, visitOccurrenceOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).visitOccurrencesGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).visitOccurrencesDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'visit_occurrence_id', 'Visit Occurrence'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'visit_occurrence_id', 'Visit Occurrence');
    const response = await container.resolve(OmopDbOmopApi).visitOccurrencesPutOne(id, { ...variables, visit_occurrence_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).visitOccurrencesPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const visitSourceValue = item.visit_source_value;
    if (typeof visitSourceValue === 'string' && visitSourceValue.trim().length > 0) {
      return visitSourceValue;
    }
    if (typeof visitSourceValue === 'number') {
      return String(visitSourceValue);
    }
    const admittedFromSourceValue = item.admitted_from_source_value;
    if (typeof admittedFromSourceValue === 'string' && admittedFromSourceValue.trim().length > 0) {
      return admittedFromSourceValue;
    }
    if (typeof admittedFromSourceValue === 'number') {
      return String(admittedFromSourceValue);
    }
    const dischargedToSourceValue = item.discharged_to_source_value;
    if (typeof dischargedToSourceValue === 'string' && dischargedToSourceValue.trim().length > 0) {
      return dischargedToSourceValue;
    }
    if (typeof dischargedToSourceValue === 'number') {
      return String(dischargedToSourceValue);
    }
    const personId = item.person_id;
    if (typeof personId === 'string' && personId.length > 0) {
      const personIdOption = personOptionsQuery.options.find(candidate => candidate.value === personId);
      if (personIdOption?.label) {
        return personIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is only assigned in this block, so it is always undefined here and the else arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- rows always have a non-empty id (withId throws otherwise), and yup-validated create values always have a non-empty person_id, so fallbackValue is set */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the preceding else ignore */
    return t`New visit occurrence`;
  }, [personOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      admitted_from_concept_id: string().nullable().notRequired(),
      admitted_from_source_value: string().nullable().notRequired(),
      care_site_id: string().nullable().notRequired(),
      discharged_to_concept_id: string().nullable().notRequired(),
      discharged_to_source_value: string().nullable().notRequired(),
      person_id: string().required(),
      preceding_visit_occurrence_id: string().nullable().notRequired(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      provider_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      visit_concept_id: string().required(),
      visit_end_date: SchemaUtil.isoString.required(),
      visit_end_datetime: SchemaUtil.isoString.nullable().notRequired(),
      visit_source_concept_id: string().nullable().notRequired(),
      visit_source_value: string().nullable().notRequired(),
      visit_start_date: SchemaUtil.isoString.required(),
      visit_start_datetime: SchemaUtil.isoString.nullable().notRequired(),
      visit_type_concept_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'visit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Visit Start Date`, name: 'visit_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Visit Start Datetime`, name: 'visit_start_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Visit End Date`, name: 'visit_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Visit End Datetime`, name: 'visit_end_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'visit_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provider ID`, loading: providerOptionsQuery.isLoading, name: 'provider_id', options: providerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Care Site ID`, loading: careSiteOptionsQuery.isLoading, name: 'care_site_id', options: careSiteOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Visit Source Value`, name: 'visit_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'visit_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Admitted From Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'admitted_from_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Admitted From Source Value`, name: 'admitted_from_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Discharged To Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'discharged_to_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Discharged To Source Value`, name: 'discharged_to_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Preceding Visit Occurrence ID`, loading: visitOccurrenceOptionsQuery.isLoading, name: 'preceding_visit_occurrence_id', options: visitOccurrenceOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, careSiteOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, providerOptionsQuery.isLoading, visitOccurrenceOptionsQuery.isLoading, organizationOptionsQuery.options, careSiteOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_concept_id', name: t`Visit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'visit_start_date', name: t`Visit Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'visit_start_datetime', name: t`Visit Start Datetime` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'visit_end_date', name: t`Visit End Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'visit_end_datetime', name: t`Visit End Datetime` }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_type_concept_id', name: t`Visit Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provider_id', name: t`Provider ID`, options: providerOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'care_site_id', name: t`Care Site ID`, options: careSiteOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'visit_source_value', name: t`Visit Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_source_concept_id', name: t`Visit Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'admitted_from_concept_id', name: t`Admitted From Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'admitted_from_source_value', name: t`Admitted From Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'discharged_to_concept_id', name: t`Discharged To Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'discharged_to_source_value', name: t`Discharged To Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'preceding_visit_occurrence_id', name: t`Preceding Visit Occurrence ID`, options: visitOccurrenceOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, careSiteOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new visit occurrence`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.VisitOccurrenceCrudCommand}
      defaultSortByField={'visit_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Visit Occurrence`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.VISIT_OCCURRENCES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('VisitOccurrencesAdminPage')}
      title={t`Visit Occurrences`}
      updateOne={updateOne}
    />
  );
};
