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
  OmopDbNote,
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

type FormFields = OmitWithMetaData<OmopDbNote, 'note_id'>;
type Row = { id: string } & OmopDbNote;
const toTableRow = (item: OmopDbNote): Row => {
  return OmopDbAdminUtil.withId(item, 'note_id', 'Note');
};
export const NotesAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const providerOptionsQuery = useProviderOptionsQuery();
  const visitDetailOptionsQuery = useVisitDetailOptionsQuery();
  const visitOccurrenceOptionsQuery = useVisitOccurrenceOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery, providerOptionsQuery, visitDetailOptionsQuery, visitOccurrenceOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).notesGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).notesDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'note_id', 'Note'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'note_id', 'Note');
    const response = await container.resolve(OmopDbOmopApi).notesPutOne(id, { ...variables, note_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).notesPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const noteSourceValue = item.note_source_value;
    if (typeof noteSourceValue === 'string' && noteSourceValue.trim().length > 0) {
      return noteSourceValue;
    }
    if (typeof noteSourceValue === 'number') {
      return String(noteSourceValue);
    }
    const personId = item.person_id;
    if (typeof personId === 'string' && personId.length > 0) {
      const personIdOption = personOptionsQuery.options.find(candidate => candidate.value === personId);
      if (personIdOption?.label) {
        return personIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined here (only assigned later in this function), so the check is always true */
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    const noteTypeConceptId = item.note_type_concept_id;
    if (typeof noteTypeConceptId === 'string' && noteTypeConceptId.length > 0) {
      const noteTypeConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === noteTypeConceptId);
      if (noteTypeConceptIdOption?.label) {
        return noteTypeConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = noteTypeConceptId;
      }
    }
    const noteClassConceptId = item.note_class_concept_id;
    if (typeof noteClassConceptId === 'string' && noteClassConceptId.length > 0) {
      const noteClassConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === noteClassConceptId);
      if (noteClassConceptIdOption?.label) {
        return noteClassConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = noteClassConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- unreachable: create values are yup-validated so person_id, note_type_concept_id and note_class_concept_id are non-empty, which always sets fallbackValue; rows always have a non-empty id and return earlier */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the preceding else ignore */
    return t`New note`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      encoding_concept_id: string().required(),
      language_concept_id: string().required(),
      note_class_concept_id: string().required(),
      note_date: SchemaUtil.isoString.required(),
      note_datetime: SchemaUtil.isoString.nullable().notRequired(),
      note_event_field_concept_id: string().nullable().notRequired(),
      note_event_id: string().nullable().notRequired(),
      note_source_value: string().nullable().notRequired(),
      note_text: string().required(),
      note_title: string().nullable().notRequired(),
      note_type_concept_id: string().required(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      provider_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      visit_detail_id: string().nullable().notRequired(),
      visit_occurrence_id: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Note Date`, name: 'note_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Note Datetime`, name: 'note_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Note Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'note_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Note Class Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'note_class_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Note Title`, name: 'note_title' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Note Text`, name: 'note_text' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Encoding Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'encoding_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Language Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'language_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provider ID`, loading: providerOptionsQuery.isLoading, name: 'provider_id', options: providerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Occurrence ID`, loading: visitOccurrenceOptionsQuery.isLoading, name: 'visit_occurrence_id', options: visitOccurrenceOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Detail ID`, loading: visitDetailOptionsQuery.isLoading, name: 'visit_detail_id', options: visitDetailOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Note Source Value`, name: 'note_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Note Event ID`, name: 'note_event_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Note Event Field Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'note_event_field_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, providerOptionsQuery.isLoading, visitDetailOptionsQuery.isLoading, visitOccurrenceOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'note_date', name: t`Note Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'note_datetime', name: t`Note Datetime` }),
      TableUtil.createOptionsColumn<Row>({ id: 'note_type_concept_id', name: t`Note Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'note_class_concept_id', name: t`Note Class Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'note_title', name: t`Note Title` }),
      TableUtil.createTextColumn<Row>({ id: 'note_text', name: t`Note Text` }),
      TableUtil.createOptionsColumn<Row>({ id: 'encoding_concept_id', name: t`Encoding Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'language_concept_id', name: t`Language Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provider_id', name: t`Provider ID`, options: providerOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_occurrence_id', name: t`Visit Occurrence ID`, options: visitOccurrenceOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_detail_id', name: t`Visit Detail ID`, options: visitDetailOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'note_source_value', name: t`Note Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'note_event_id', name: t`Note Event ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'note_event_field_concept_id', name: t`Note Event Field Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new note`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.NoteCrudCommand}
      defaultSortByField={'note_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Note`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.NOTES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('NotesAdminPage')}
      title={t`Notes`}
      updateOne={updateOne}
    />
  );
};
