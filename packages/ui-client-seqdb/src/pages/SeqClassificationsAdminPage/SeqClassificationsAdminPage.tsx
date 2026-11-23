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
  SeqDbSeqClassification,
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
import { useSeqCategoryOptionsQuery } from '../../dataHooks/useSeqCategoriesQuery';
import { useSeqOptionsQuery } from '../../dataHooks/useSeqsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<
  SeqDbSeqClassification,
  'primary_category' | 'protocol' | 'qc_report' | 'qc_result_human' | 'qc_result_machine' | 'qc_score' | 'sample' | 'seq'
>;
type SeqDbSeqClassificationWithId = {
  id: string;
  qc_report?: unknown;
} & Omit<SeqDbSeqClassification, 'id' | 'qc_report'>;

const isSeqDbSeqClassificationWithId = (item: SeqDbSeqClassification): item is SeqDbSeqClassificationWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

const requireSeqClassificationId = (item: SeqDbSeqClassification): SeqDbSeqClassificationWithId => {
  if (!isSeqDbSeqClassificationWithId(item)) {
    throw new Error('SeqDB returned a sequence classification without an ID.');
  }
  return item;
};

export const SeqClassificationsAdminPage = () => {
  const { t } = useTranslation();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const seqCategoryOptionsQuery = useSeqCategoryOptionsQuery();
  const seqOptionsQuery = useSeqOptionsQuery();
  const loadables = useArray([
    protocolOptionsQuery,
    sampleOptionsQuery,
    seqCategoryOptionsQuery,
    seqOptionsQuery,
  ]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).seqClassificationsGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbSeqClassificationWithId)) {
      throw new Error('SeqDB returned a sequence classification without an ID.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).seqClassificationsPostOne(variables);
    return requireSeqClassificationId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqClassificationWithId) => {
    const writableItem: SeqDbSeqClassification = {
      ...variables,
      id: item.id,
      qc_report: item.qc_report,
      qc_result_human: item.qc_result_human,
      qc_result_machine: item.qc_result_machine,
      qc_score: item.qc_score,
    };
    const response = await container.resolve(SeqDbSeqApi).seqClassificationsPutOne(item.id, {
      ...writableItem,
    });

    return requireSeqClassificationId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqClassificationWithId) => {
    return container.resolve(SeqDbSeqApi).seqClassificationsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqClassificationWithId) => {
    const sampleLabel = sampleOptionsQuery.options.find(option => option.value === item.sample_id)?.label ?? item.sample_id;
    const categoryLabel = seqCategoryOptionsQuery.options.find(option => option.value === item.primary_category_id)?.label ?? item.primary_category_id;
    const protocolLabel = protocolOptionsQuery.options.find(option => option.value === item.protocol_id)?.label ?? item.protocol_id;
    /* v8 ignore next 4 -- the trailing `|| ''` is unreachable: content is required by yup and every row has a non-empty ID (fetchAll) */
    return [sampleLabel, categoryLabel, protocolLabel].filter(Boolean).join(' - ')
      || item.content.slice(0, 60)
      || ('id' in item && item.id)
      || '';
  }, [protocolOptionsQuery.options, sampleOptionsQuery.options, seqCategoryOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      content: string().required(),
      content_hash: string().matches(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i).required(),
      content2: string().nullable().optional(),
      format: string().required(),
      primary_category_id: string().required(),
      protocol_id: string().required(),
      sample_id: string().required(),
      seq_id: string().nullable().optional(),
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
      label: t`Primary category`,
      loading: seqCategoryOptionsQuery.isLoading,
      name: 'primary_category_id',
      options: seqCategoryOptionsQuery.options,
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
    seqCategoryOptionsQuery.isLoading,
    seqCategoryOptionsQuery.options,
    seqOptionsQuery.isLoading,
    seqOptionsQuery.options,
    t,
  ]);

  const tableColumns = useMemo((): TableColumn<SeqDbSeqClassificationWithId>[] => [
    TableUtil.createOptionsColumn<SeqDbSeqClassificationWithId>({
      id: 'sample_id',
      name: t`Sample`,
      options: sampleOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqClassificationWithId>({
      id: 'primary_category_id',
      name: t`Primary category`,
      options: seqCategoryOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqClassificationWithId>({
      id: 'protocol_id',
      name: t`Protocol`,
      options: protocolOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqClassificationWithId>({
      id: 'seq_id',
      name: t`Sequence`,
      options: seqOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqClassificationWithId>({ id: 'format', name: t`Format` }),
    TableUtil.createTextColumn<SeqDbSeqClassificationWithId>({ id: 'content_hash', name: t`Content hash` }),
  ], [
    protocolOptionsQuery.options,
    sampleOptionsQuery.options,
    seqCategoryOptionsQuery.options,
    seqOptionsQuery.options,
    t,
  ]);

  return (
    <CrudPage<FormFields, SeqDbSeqClassificationWithId, SeqDbSeqClassificationWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence classification`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqClassificationCrudCommand}
      defaultSortByField={'sample_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence classification`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_CLASSIFICATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqClassificationsAdminPage')}
      title={t`Sequence classifications`}
      updateOne={updateOne}
    />
  );
};
