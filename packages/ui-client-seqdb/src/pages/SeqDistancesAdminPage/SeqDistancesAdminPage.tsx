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
  SeqDbApiPermission,
  SeqDbSeqDistance,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
} from '@gen-epix/api-seqdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';

import { useProtocolOptionsQuery } from '../../dataHooks/useProtocolsQuery';
import { useSampleOptionsQuery } from '../../dataHooks/useSamplesQuery';
import { useSeqProfileOptionsQuery } from '../../dataHooks/useSeqProfilesQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbSeqDistance, 'content_hash' | 'protocol' | 'sample' | 'seq_profile'>;
type SeqDbSeqDistanceWithId = { id: string } & SeqDbSeqDistance;

const isSeqDbSeqDistanceWithId = (item: SeqDbSeqDistance): item is SeqDbSeqDistanceWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

const requireSeqDistanceId = (item: SeqDbSeqDistance): SeqDbSeqDistanceWithId => {
  if (!isSeqDbSeqDistanceWithId(item)) {
    throw new Error('SeqDB returned a sequence distance without an ID.');
  }
  return item;
};

export const SeqDistancesAdminPage = () => {
  const { t } = useTranslation();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const seqProfileOptionsQuery = useSeqProfileOptionsQuery();
  const loadables = useArray([
    protocolOptionsQuery,
    sampleOptionsQuery,
    seqProfileOptionsQuery,
  ]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).seqDistancesGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbSeqDistanceWithId)) {
      throw new Error('SeqDB returned a sequence distance without an ID.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).seqDistancesPostOne(variables);
    return requireSeqDistanceId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqDistanceWithId) => {
    const response = await container.resolve(SeqDbSeqApi).seqDistancesPutOne(item.id, {
      ...variables,
      content_hash: item.content_hash,
      id: item.id,
    });

    return requireSeqDistanceId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqDistanceWithId) => {
    return container.resolve(SeqDbSeqApi).seqDistancesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqDistanceWithId) => {
    const sampleLabel = sampleOptionsQuery.options.find(option => option.value === item.sample_id)?.label ?? item.sample_id;
    const profileLabel = seqProfileOptionsQuery.options.find(option => option.value === item.seq_profile_id)?.label ?? item.seq_profile_id;
    const protocolLabel = protocolOptionsQuery.options.find(option => option.value === item.protocol_id)?.label ?? item.protocol_id;
    /* v8 ignore start -- the final '' is unreachable: stored items always have a non-empty id (guarded by isSeqDbSeqDistanceWithId) and form values always have non-empty content (required by the schema) */
    return [profileLabel, sampleLabel, protocolLabel].filter(Boolean).join(' - ')
      || item.content.slice(0, 60)
      || ('id' in item && item.id)
      || '';
    /* v8 ignore stop */
  }, [protocolOptionsQuery.options, sampleOptionsQuery.options, seqProfileOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      content: string().required(),
      content2: string().nullable().optional(),
      format: string().required(),
      protocol_id: string().required(),
      sample_id: string().required(),
      seq_profile_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Sample`,
      loading: sampleOptionsQuery.isLoading,
      name: 'sample_id',
      options: sampleOptionsQuery.options,
      required: true,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Protocol`,
      loading: protocolOptionsQuery.isLoading,
      name: 'protocol_id',
      options: protocolOptionsQuery.options,
      required: true,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Sequence profile`,
      loading: seqProfileOptionsQuery.isLoading,
      name: 'seq_profile_id',
      options: seqProfileOptionsQuery.options,
      required: true,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`Format`,
      name: 'format',
      required: true,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`Content`,
      multiline: true,
      name: 'content',
      required: true,
      rows: 6,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`Additional content`,
      multiline: true,
      name: 'content2',
      rows: 4,
    } as const satisfies FormFieldDefinition<FormFields>,
  ], [
    protocolOptionsQuery.isLoading,
    protocolOptionsQuery.options,
    sampleOptionsQuery.isLoading,
    sampleOptionsQuery.options,
    seqProfileOptionsQuery.isLoading,
    seqProfileOptionsQuery.options,
    t,
  ]);

  const tableColumns = useMemo((): TableColumn<SeqDbSeqDistanceWithId>[] => [
    TableUtil.createOptionsColumn<SeqDbSeqDistanceWithId>({
      id: 'seq_profile_id',
      name: t`Sequence profile`,
      options: seqProfileOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqDistanceWithId>({
      id: 'sample_id',
      name: t`Sample`,
      options: sampleOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqDistanceWithId>({
      id: 'protocol_id',
      name: t`Protocol`,
      options: protocolOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqDistanceWithId>({ id: 'format', name: t`Format` }),
  ], [protocolOptionsQuery.options, sampleOptionsQuery.options, seqProfileOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbSeqDistanceWithId, SeqDbSeqDistanceWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence distance`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqDistanceCrudCommand}
      defaultSortByField={'seq_profile_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence distance`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_DISTANCES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqDistancesAdminPage')}
      title={t`Sequence distances`}
      updateOne={updateOne}
    />
  );
};
