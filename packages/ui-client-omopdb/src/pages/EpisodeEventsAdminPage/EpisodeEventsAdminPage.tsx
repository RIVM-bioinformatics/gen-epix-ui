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
  OmopDbEpisodeEvent,
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
import { useEpisodeOptionsQuery } from '../../dataHooks/useEpisodeQuery';

type FormFields = OmitWithMetaData<OmopDbEpisodeEvent, 'episode_event_id'>;
type Row = { id: string } & OmopDbEpisodeEvent;
const toTableRow = (item: OmopDbEpisodeEvent): Row => {
  return OmopDbAdminUtil.withId(item, 'episode_event_id', 'Episode Event');
};
export const EpisodeEventsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const episodeOptionsQuery = useEpisodeOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, episodeOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).episodeEventsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).episodeEventsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'episode_event_id', 'Episode Event'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'episode_event_id', 'Episode Event');
    const response = await container.resolve(OmopDbOmopApi).episodeEventsPutOne(id, { ...variables, episode_event_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).episodeEventsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const episodeId = item.episode_id;
    if (typeof episodeId === 'string' && episodeId.length > 0) {
      const episodeIdOption = episodeOptionsQuery.options.find(candidate => candidate.value === episodeId);
      if (episodeIdOption?.label) {
        return episodeIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = episodeId;
      }
    }
    const episodeEventFieldConceptId = item.episode_event_field_concept_id;
    if (typeof episodeEventFieldConceptId === 'string' && episodeEventFieldConceptId.length > 0) {
      const episodeEventFieldConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === episodeEventFieldConceptId);
      if (episodeEventFieldConceptIdOption?.label) {
        return episodeEventFieldConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = episodeEventFieldConceptId;
      }
    }
    const provenanceId = item.provenance_id;
    if (typeof provenanceId === 'string' && provenanceId.trim().length > 0) {
      return provenanceId;
    }
    if (typeof provenanceId === 'number') {
      return String(provenanceId);
    }
    const sourceTraceback = item.source_traceback;
    if (typeof sourceTraceback === 'string' && sourceTraceback.trim().length > 0) {
      return sourceTraceback;
    }
    if (typeof sourceTraceback === 'number') {
      return String(sourceTraceback);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New episode event`;
  }, [episodeOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      episode_event_field_concept_id: string().required(),
      episode_id: string().required(),
      event_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Episode ID`, loading: episodeOptionsQuery.isLoading, name: 'episode_id', options: episodeOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Event ID`, name: 'event_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Episode Event Field Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'episode_event_field_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, episodeOptionsQuery.isLoading, conceptOptionsQuery.options, episodeOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'episode_id', name: t`Episode ID`, options: episodeOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'event_id', name: t`Event ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'episode_event_field_concept_id', name: t`Episode Event Field Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, episodeOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new episode event`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.EpisodeEventCrudCommand}
      defaultSortByField={'episode_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Episode Event`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.EPISODE_EVENTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('EpisodeEventsAdminPage')}
      title={t`Episode Events`}
      updateOne={updateOne}
    />
  );
};
