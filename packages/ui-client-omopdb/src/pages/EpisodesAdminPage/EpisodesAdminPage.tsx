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
  OmopDbEpisode,
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
import { useEpisodeOptionsQuery } from '../../dataHooks/useEpisodeQuery';
import { usePersonOptionsQuery } from '../../dataHooks/usePersonQuery';

type FormFields = OmitWithMetaData<OmopDbEpisode, 'episode_id'>;
type Row = { id: string } & OmopDbEpisode;
const toTableRow = (item: OmopDbEpisode): Row => {
  return OmopDbAdminUtil.withId(item, 'episode_id', 'Episode');
};
export const EpisodesAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const episodeOptionsQuery = useEpisodeOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, episodeOptionsQuery, personOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).episodesGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).episodesDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'episode_id', 'Episode'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'episode_id', 'Episode');
    const response = await container.resolve(OmopDbOmopApi).episodesPutOne(id, { ...variables, episode_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).episodesPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const episodeSourceValue = item.episode_source_value;
    if (typeof episodeSourceValue === 'string' && episodeSourceValue.trim().length > 0) {
      return episodeSourceValue;
    }
    if (typeof episodeSourceValue === 'number') {
      return String(episodeSourceValue);
    }
    const personId = item.person_id;
    if (typeof personId === 'string' && personId.length > 0) {
      const personIdOption = personOptionsQuery.options.find(candidate => candidate.value === personId);
      if (personIdOption?.label) {
        return personIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is still undefined at this first assignment, so the check is always true */
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    const episodeConceptId = item.episode_concept_id;
    if (typeof episodeConceptId === 'string' && episodeConceptId.length > 0) {
      const episodeConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === episodeConceptId);
      if (episodeConceptIdOption?.label) {
        return episodeConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = episodeConceptId;
      }
    }
    const episodeParentId = item.episode_parent_id;
    if (typeof episodeParentId === 'string' && episodeParentId.length > 0) {
      const episodeParentIdOption = episodeOptionsQuery.options.find(candidate => candidate.value === episodeParentId);
      if (episodeParentIdOption?.label) {
        return episodeParentIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = episodeParentId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- create values always have non-empty episode_concept_id and person_id (yup required), which set fallbackValue, and rows always have an id, so this return is never reached */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the else skip above */
    return t`New episode`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, episodeOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      episode_concept_id: string().required(),
      episode_end_date: SchemaUtil.isoString.nullable().notRequired(),
      episode_end_datetime: SchemaUtil.isoString.nullable().notRequired(),
      episode_number: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      episode_object_concept_id: string().required(),
      episode_parent_id: string().nullable().notRequired(),
      episode_source_concept_id: string().nullable().notRequired(),
      episode_source_value: string().nullable().notRequired(),
      episode_start_date: SchemaUtil.isoString.required(),
      episode_start_datetime: SchemaUtil.isoString.nullable().notRequired(),
      episode_type_concept_id: string().required(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Episode Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'episode_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Episode Start Date`, name: 'episode_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Episode Start Datetime`, name: 'episode_start_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Episode End Date`, name: 'episode_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Episode End Datetime`, name: 'episode_end_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Episode Parent ID`, loading: episodeOptionsQuery.isLoading, name: 'episode_parent_id', options: episodeOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Episode Number`, name: 'episode_number', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Episode Object Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'episode_object_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Episode Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'episode_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Episode Source Value`, name: 'episode_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Episode Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'episode_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, episodeOptionsQuery.isLoading, personOptionsQuery.isLoading, conceptOptionsQuery.options, episodeOptionsQuery.options, personOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'episode_concept_id', name: t`Episode Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'episode_start_date', name: t`Episode Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'episode_start_datetime', name: t`Episode Start Datetime` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'episode_end_date', name: t`Episode End Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'episode_end_datetime', name: t`Episode End Datetime` }),
      TableUtil.createOptionsColumn<Row>({ id: 'episode_parent_id', name: t`Episode Parent ID`, options: episodeOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'episode_number', name: t`Episode Number` }),
      TableUtil.createOptionsColumn<Row>({ id: 'episode_object_concept_id', name: t`Episode Object Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'episode_type_concept_id', name: t`Episode Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'episode_source_value', name: t`Episode Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'episode_source_concept_id', name: t`Episode Source Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, episodeOptionsQuery.options, personOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new episode`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.EpisodeCrudCommand}
      defaultSortByField={'episode_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Episode`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.EPISODES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('EpisodesAdminPage')}
      title={t`Episodes`}
      updateOne={updateOne}
    />
  );
};
