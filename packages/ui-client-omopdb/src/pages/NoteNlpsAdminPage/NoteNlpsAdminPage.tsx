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
  OmopDbNoteNlp,
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

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { useNoteOptionsQuery } from '../../dataHooks/useNoteQuery';

type FormFields = OmitWithMetaData<OmopDbNoteNlp, 'note_nlp_id'>;
type Row = { id: string } & OmopDbNoteNlp;
const toTableRow = (item: OmopDbNoteNlp): Row => {
  return OmopDbAdminUtil.withId(item, 'note_nlp_id', 'Note NLP');
};
export const NoteNlpsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const noteOptionsQuery = useNoteOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, noteOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).noteNlpsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).noteNlpsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'note_nlp_id', 'Note NLP'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'note_nlp_id', 'Note NLP');
    const response = await container.resolve(OmopDbOmopApi).noteNlpsPutOne(id, { ...variables, note_nlp_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).noteNlpsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const noteId = item.note_id;
    if (typeof noteId === 'string' && noteId.length > 0) {
      const noteIdOption = noteOptionsQuery.options.find(candidate => candidate.value === noteId);
      if (noteIdOption?.label) {
        return noteIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined here (only assigned in this block after this check), so the check is always true */
      if (!fallbackValue) {
        fallbackValue = noteId;
      }
    }
    const sectionConceptId = item.section_concept_id;
    if (typeof sectionConceptId === 'string' && sectionConceptId.length > 0) {
      const sectionConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === sectionConceptId);
      if (sectionConceptIdOption?.label) {
        return sectionConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = sectionConceptId;
      }
    }
    const noteNlpConceptId = item.note_nlp_concept_id;
    if (typeof noteNlpConceptId === 'string' && noteNlpConceptId.length > 0) {
      const noteNlpConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === noteNlpConceptId);
      if (noteNlpConceptIdOption?.label) {
        return noteNlpConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = noteNlpConceptId;
      }
    }
    const noteNlpSourceConceptId = item.note_nlp_source_concept_id;
    if (typeof noteNlpSourceConceptId === 'string' && noteNlpSourceConceptId.length > 0) {
      const noteNlpSourceConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === noteNlpSourceConceptId);
      if (noteNlpSourceConceptIdOption?.label) {
        return noteNlpSourceConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = noteNlpSourceConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- unreachable: create values are yup-validated so note_id is a non-empty string, which always sets fallbackValue; rows always have a non-empty id and return earlier */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the preceding else ignore */
    return t`New note nlp`;
  }, [noteOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      lexical_variant: string().required(),
      nlp_date: string().required(),
      nlp_datetime: string().nullable().notRequired(),
      nlp_system: string().nullable().notRequired(),
      note_id: string().required(),
      note_nlp_concept_id: string().nullable().notRequired(),
      note_nlp_source_concept_id: string().nullable().notRequired(),
      offset: string().nullable().notRequired(),
      provenance_id: string().nullable().notRequired(),
      section_concept_id: string().nullable().notRequired(),
      snippet: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      term_exists: string().nullable().notRequired(),
      term_modifiers: string().nullable().notRequired(),
      term_temporal: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Note ID`, loading: noteOptionsQuery.isLoading, name: 'note_id', options: noteOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Section Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'section_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Snippet`, name: 'snippet' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Lexical Variant`, name: 'lexical_variant' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Note NLP Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'note_nlp_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Note NLP Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'note_nlp_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`NLP System`, name: 'nlp_system' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`NLP Date`, name: 'nlp_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`NLP Datetime`, name: 'nlp_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Term Exists`, name: 'term_exists' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Term Temporal`, name: 'term_temporal' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Term Modifiers`, name: 'term_modifiers' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Offset`, name: 'offset' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, noteOptionsQuery.isLoading, conceptOptionsQuery.options, noteOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'note_id', name: t`Note ID`, options: noteOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'section_concept_id', name: t`Section Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'snippet', name: t`Snippet` }),
      TableUtil.createTextColumn<Row>({ id: 'lexical_variant', name: t`Lexical Variant` }),
      TableUtil.createOptionsColumn<Row>({ id: 'note_nlp_concept_id', name: t`Note NLP Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'note_nlp_source_concept_id', name: t`Note NLP Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'nlp_system', name: t`NLP System` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'nlp_date', name: t`NLP Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'nlp_datetime', name: t`NLP Datetime` }),
      TableUtil.createTextColumn<Row>({ id: 'term_exists', name: t`Term Exists` }),
      TableUtil.createTextColumn<Row>({ id: 'term_temporal', name: t`Term Temporal` }),
      TableUtil.createTextColumn<Row>({ id: 'term_modifiers', name: t`Term Modifiers` }),
      TableUtil.createTextColumn<Row>({ id: 'offset', name: t`Offset` }),
    ];
  }, [conceptOptionsQuery.options, noteOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new note nlp`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.NoteNlpCrudCommand}
      defaultSortByField={'note_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Note NLP`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.NOTE_NLPS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('NoteNlpsAdminPage')}
      title={t`Note NLPs`}
      updateOne={updateOne}
    />
  );
};
