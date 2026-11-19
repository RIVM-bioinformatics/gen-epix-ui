import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbSeqProfile,
  SeqDbSeqProfileType,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
  SeqDbSeqProfileType as SeqDbSeqProfileTypeValues,
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
import { useSeqOptionsQuery } from '../../dataHooks/useSeqsQuery';
import { useSeqProfileTypeOptionsQuery } from '../../dataHooks/useSeqProfileTypeOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<
  SeqDbSeqProfile,
  'protocol' | 'qc_report' | 'qc_result_human' | 'qc_result_machine' | 'qc_score' | 'sample' | 'seq'
>;
type SeqDbSeqProfileWithId = {
  id: string;
  qc_report?: unknown;
} & Omit<SeqDbSeqProfile, 'id' | 'qc_report'>;

const isSeqDbSeqProfileWithId = (item: SeqDbSeqProfile): item is SeqDbSeqProfileWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

const requireSeqProfileId = (item: SeqDbSeqProfile): SeqDbSeqProfileWithId => {
  if (!isSeqDbSeqProfileWithId(item)) {
    throw new Error('SeqDB returned a sequence profile without an ID.');
  }
  return item;
};

export const SeqProfilesAdminPage = () => {
  const { t } = useTranslation();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const seqOptionsQuery = useSeqOptionsQuery();
  const seqProfileTypeOptionsQuery = useSeqProfileTypeOptionsQuery();
  const loadables = useArray([
    protocolOptionsQuery,
    sampleOptionsQuery,
    seqOptionsQuery,
    seqProfileTypeOptionsQuery,
  ]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).seqProfilesGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbSeqProfileWithId)) {
      throw new Error('SeqDB returned a sequence profile without an ID.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).seqProfilesPostOne(variables);
    return requireSeqProfileId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqProfileWithId) => {
    const writableItem: SeqDbSeqProfile = {
      ...variables,
      id: item.id,
      qc_report: item.qc_report,
      qc_result_human: item.qc_result_human,
      qc_result_machine: item.qc_result_machine,
      qc_score: item.qc_score,
    };
    const response = await container.resolve(SeqDbSeqApi).seqProfilesPutOne(item.id, {
      ...writableItem,
    });

    return requireSeqProfileId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqProfileWithId) => {
    return container.resolve(SeqDbSeqApi).seqProfilesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqProfileWithId) => {
    const profileTypeLabel = seqProfileTypeOptionsQuery.options.find(option => option.value === item.seq_profile_type)?.label ?? String(item.seq_profile_type);
    const sampleLabel = sampleOptionsQuery.options.find(option => option.value === item.sample_id)?.label ?? item.sample_id;
    const protocolLabel = protocolOptionsQuery.options.find(option => option.value === item.protocol_id)?.label ?? item.protocol_id;
    return [profileTypeLabel, sampleLabel, protocolLabel].filter(Boolean).join(' - ')
      || item.content.slice(0, 60)
      || ('id' in item && item.id)
      || '';
  }, [protocolOptionsQuery.options, sampleOptionsQuery.options, seqProfileTypeOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      content: string().required(),
      content_hash: string().matches(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i).required(),
      content2: string().nullable().optional(),
      format: string().required(),
      protocol_id: string().required(),
      sample_id: string().required(),
      seq_id: string().nullable().optional(),
      seq_profile_type: mixed<SeqDbSeqProfileType>().oneOf(Object.values(SeqDbSeqProfileTypeValues)).required(),
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
      label: t`Sequence`,
      loading: seqOptionsQuery.isLoading,
      name: 'seq_id',
      options: seqOptionsQuery.options,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Sequence profile type`,
      name: 'seq_profile_type',
      options: seqProfileTypeOptionsQuery.options,
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
      label: t`Content hash`,
      name: 'content_hash',
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
    seqOptionsQuery.isLoading,
    seqOptionsQuery.options,
    seqProfileTypeOptionsQuery.options,
    t,
  ]);

  const tableColumns = useMemo((): TableColumn<SeqDbSeqProfileWithId>[] => [
    TableUtil.createOptionsColumn<SeqDbSeqProfileWithId>({
      id: 'seq_profile_type',
      name: t`Sequence profile type`,
      options: seqProfileTypeOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqProfileWithId>({
      id: 'sample_id',
      name: t`Sample`,
      options: sampleOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqProfileWithId>({
      id: 'protocol_id',
      name: t`Protocol`,
      options: protocolOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqProfileWithId>({
      id: 'seq_id',
      name: t`Sequence`,
      options: seqOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqProfileWithId>({ id: 'format', name: t`Format` }),
    TableUtil.createTextColumn<SeqDbSeqProfileWithId>({ id: 'content_hash', name: t`Content hash` }),
  ], [
    protocolOptionsQuery.options,
    sampleOptionsQuery.options,
    seqOptionsQuery.options,
    seqProfileTypeOptionsQuery.options,
    t,
  ]);

  return (
    <CrudPage<FormFields, SeqDbSeqProfileWithId, SeqDbSeqProfileWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence profile`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqProfileCrudCommand}
      defaultSortByField={'seq_profile_type'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence profile`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_PROFILES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqProfilesAdminPage')}
      title={t`Sequence profiles`}
      updateOne={updateOne}
    />
  );
};
