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
  SeqDbSeqTaxonomy,
  SeqDbSeqTaxonomyFormat,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
  SeqDbSeqTaxonomyFormat as SeqDbSeqTaxonomyFormatValues,
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
import { useTaxonOptionsQuery } from '../../dataHooks/useTaxaQuery';
import { useSeqTaxonomyFormatOptionsQuery } from '../../dataHooks/useSeqTaxonomyFormatOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<
  SeqDbSeqTaxonomy,
  'primary_taxon' | 'protocol' | 'qc_report' | 'qc_result_human' | 'qc_result_machine' | 'qc_score' | 'sample' | 'seq'
>;
type SeqDbSeqTaxonomyWithId = {
  id: string;
  qc_report?: unknown;
} & Omit<SeqDbSeqTaxonomy, 'id' | 'qc_report'>;

const isSeqDbSeqTaxonomyWithId = (item: SeqDbSeqTaxonomy): item is SeqDbSeqTaxonomyWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

const requireSeqTaxonomyId = (item: SeqDbSeqTaxonomy): SeqDbSeqTaxonomyWithId => {
  if (!isSeqDbSeqTaxonomyWithId(item)) {
    throw new Error('SeqDB returned a sequence taxonomy without an ID.');
  }
  return item;
};

export const SeqTaxonomiesAdminPage = () => {
  const { t } = useTranslation();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const seqOptionsQuery = useSeqOptionsQuery();
  const taxonOptionsQuery = useTaxonOptionsQuery();
  const seqTaxonomyFormatOptionsQuery = useSeqTaxonomyFormatOptionsQuery();
  const loadables = useArray([
    protocolOptionsQuery,
    sampleOptionsQuery,
    seqOptionsQuery,
    taxonOptionsQuery,
    seqTaxonomyFormatOptionsQuery,
  ]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).seqTaxonomiesGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbSeqTaxonomyWithId)) {
      throw new Error('SeqDB returned a sequence taxonomy without an ID.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).seqTaxonomiesPostOne(variables);
    return requireSeqTaxonomyId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqTaxonomyWithId) => {
    const writableItem: SeqDbSeqTaxonomy = {
      ...variables,
      id: item.id,
      qc_report: item.qc_report,
      qc_result_human: item.qc_result_human,
      qc_result_machine: item.qc_result_machine,
      qc_score: item.qc_score,
    };
    const response = await container.resolve(SeqDbSeqApi).seqTaxonomiesPutOne(item.id, {
      ...writableItem,
    });

    return requireSeqTaxonomyId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqTaxonomyWithId) => {
    return container.resolve(SeqDbSeqApi).seqTaxonomiesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqTaxonomyWithId) => {
    const taxonLabel = taxonOptionsQuery.options.find(option => option.value === item.primary_taxon_id)?.label ?? item.primary_taxon_id;
    const sampleLabel = sampleOptionsQuery.options.find(option => option.value === item.sample_id)?.label ?? item.sample_id;
    return [taxonLabel, sampleLabel].filter(Boolean).join(' - ')
      || item.content.slice(0, 60)
      || ('id' in item && item.id)
      || '';
  }, [sampleOptionsQuery.options, taxonOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      content: string().required(),
      content_hash: string().matches(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i).required(),
      content2: string().nullable().optional(),
      format: mixed<SeqDbSeqTaxonomyFormat>().oneOf(Object.values(SeqDbSeqTaxonomyFormatValues)).optional(),
      primary_taxon_id: string().required(),
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
      label: t`Primary taxon`,
      loading: taxonOptionsQuery.isLoading,
      name: 'primary_taxon_id',
      options: taxonOptionsQuery.options,
      required: true,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Format`,
      name: 'format',
      options: seqTaxonomyFormatOptionsQuery.options,
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
    seqTaxonomyFormatOptionsQuery.options,
    taxonOptionsQuery.isLoading,
    taxonOptionsQuery.options,
    t,
  ]);

  const tableColumns = useMemo((): TableColumn<SeqDbSeqTaxonomyWithId>[] => [
    TableUtil.createOptionsColumn<SeqDbSeqTaxonomyWithId>({
      id: 'primary_taxon_id',
      name: t`Primary taxon`,
      options: taxonOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqTaxonomyWithId>({
      id: 'sample_id',
      name: t`Sample`,
      options: sampleOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqTaxonomyWithId>({
      id: 'protocol_id',
      name: t`Protocol`,
      options: protocolOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqTaxonomyWithId>({
      id: 'seq_id',
      name: t`Sequence`,
      options: seqOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqTaxonomyWithId>({
      id: 'format',
      name: t`Format`,
      options: seqTaxonomyFormatOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqTaxonomyWithId>({ id: 'content_hash', name: t`Content hash` }),
  ], [
    protocolOptionsQuery.options,
    sampleOptionsQuery.options,
    seqOptionsQuery.options,
    seqTaxonomyFormatOptionsQuery.options,
    taxonOptionsQuery.options,
    t,
  ]);

  return (
    <CrudPage<FormFields, SeqDbSeqTaxonomyWithId, SeqDbSeqTaxonomyWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence taxonomy`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqTaxonomyCrudCommand}
      defaultSortByField={'primary_taxon_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence taxonomy`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_TAXONOMIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqTaxonomiesAdminPage')}
      title={t`Sequence taxonomies`}
      updateOne={updateOne}
    />
  );
};
