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
  SeqDbContig,
  SeqDbFileCompression,
  SeqDbSeq,
  SeqDbSeqFileFormat,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbFileCompression as SeqDbFileCompressionValues,
  SeqDbSeqApi,
  SeqDbSeqFileFormat as SeqDbSeqFileFormatValues,
  SeqDbSeqFormat,
} from '@gen-epix/api-seqdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { useFileOptionsQuery } from '../../dataHooks/useFilesQuery';
import { useFileCompressionOptionsQuery } from '../../dataHooks/useFileCompressionOptionsQuery';
import { useProtocolOptionsQuery } from '../../dataHooks/useProtocolsQuery';
import { useReadSetOptionsQuery } from '../../dataHooks/useReadSetsQuery';
import { useSampleOptionsQuery } from '../../dataHooks/useSamplesQuery';
import { useSeqFileFormatOptionsQuery } from '../../dataHooks/useSeqFileFormatOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = {
  contigs_json: string;
} & OmitWithMetaData<
  SeqDbSeq,
  'contigs' | 'file' | 'protocol' | 'qc_report' | 'qc_result_human' | 'qc_result_machine' | 'qc_score' | 'read_set' | 'read_set2' | 'sample' | 'seq_hash'
>;
type SeqDbSeqWithId = {
  id: string;
  qc_report?: unknown;
} & Omit<SeqDbSeq, 'id' | 'qc_report'>;

const isSeqDbSeqWithId = (item: SeqDbSeq): item is SeqDbSeqWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

const requireSeqId = (item: SeqDbSeq): SeqDbSeqWithId => {
  if (!isSeqDbSeqWithId(item)) {
    throw new Error('SeqDB returned a sequence without an ID.');
  }
  return item;
};

const isRecord = (item: unknown): item is Record<string, unknown> => {
  return typeof item === 'object' && item !== null;
};

const isSeqDbContig = (item: unknown): item is SeqDbContig => {
  if (!isRecord(item) || typeof item.seq !== 'string') {
    return false;
  }

  const seqFormat = item.seq_format;
  if (seqFormat !== undefined && !Object.values(SeqDbSeqFormat).some(value => value === seqFormat)) {
    return false;
  }

  return item.length === undefined || typeof item.length === 'number';
};

const parseContigs = (value: string): SeqDbContig[] => {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every(isSeqDbContig)) {
    throw new Error('Contigs must be a JSON array with a sequence string for each contig.');
  }

  return parsed;
};

export const SeqsAdminPage = () => {
  const { t } = useTranslation();
  const fileOptionsQuery = useFileOptionsQuery();
  const fileCompressionOptionsQuery = useFileCompressionOptionsQuery();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const readSetOptionsQuery = useReadSetOptionsQuery();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const seqFileFormatOptionsQuery = useSeqFileFormatOptionsQuery();
  const loadables = useArray([
    fileOptionsQuery,
    fileCompressionOptionsQuery,
    protocolOptionsQuery,
    readSetOptionsQuery,
    sampleOptionsQuery,
    seqFileFormatOptionsQuery,
  ]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).seqsGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbSeqWithId)) {
      throw new Error('SeqDB returned a sequence without an ID.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const { contigs_json, ...writableFields } = variables;
    const response = await container.resolve(SeqDbSeqApi).seqsPostOne({
      ...writableFields,
      contigs: parseContigs(contigs_json),
    });

    return requireSeqId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqWithId) => {
    /* v8 ignore start -- canEditItem disables Save for sequences with contigs, so the UI never calls updateOne for them */
    if (item.contigs?.length) {
      throw new Error(t`Available sequences cannot be edited.`);
    }
    /* v8 ignore stop */

    const { contigs_json, ...formFields } = variables;
    const response = await container.resolve(SeqDbSeqApi).seqsPutOne(item.id, {
      ...formFields,
      contigs: parseContigs(contigs_json),
      id: item.id,
      qc_report: item.qc_report,
      qc_result_human: item.qc_result_human,
      qc_result_machine: item.qc_result_machine,
      qc_score: item.qc_score,
      seq_hash: item.seq_hash,
    });

    return requireSeqId(response.data);
  }, [t]);

  const deleteOne = useCallback(async (item: SeqDbSeqWithId) => {
    if (item.contigs?.length) {
      throw new Error(t`Available sequences cannot be deleted.`);
    }

    return container.resolve(SeqDbSeqApi).seqsDeleteOne(item.id);
  }, [t]);

  const getFormValuesFromItem = useCallback((item?: SeqDbSeqWithId): Partial<FormFields> => {
    if (!item) {
      return {};
    }
    return {
      code: item.code,
      contigs_json: JSON.stringify(item.contigs ?? [], null, 2),
      file_compression: item.file_compression,
      file_format: item.file_format,
      file_hash: item.file_hash,
      file_id: item.file_id,
      protocol_id: item.protocol_id,
      read_set_id: item.read_set_id,
      read_set2_id: item.read_set2_id,
      sample_id: item.sample_id,
      uri: item.uri,
    };
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqWithId) => {
    return item.code
      || ('seq_hash' in item && item.seq_hash)
      || ('id' in item && item.id)
      || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>()
      .shape({
        code: SchemaUtil.code.nullable().notRequired(),
        contigs_json: string()
          .required()
          .test('valid-contigs', t`Enter a JSON array of valid contigs`, (value) => {
            try {
              /* v8 ignore start -- contigs_json always holds a string (create default '[]', edit JSON, text input), so the nullish fallback is unreachable */
              parseContigs(value ?? '[]');
              /* v8 ignore stop */
              return true;
            } catch {
              return false;
            }
          }),
        file_compression: mixed<SeqDbFileCompression>().oneOf(Object.values(SeqDbFileCompressionValues)).optional(),
        file_format: mixed<SeqDbSeqFileFormat>().oneOf(Object.values(SeqDbSeqFileFormatValues)).optional(),
        file_hash: string().nullable().optional(),
        file_id: string().nullable().optional(),
        protocol_id: string().optional(),
        read_set_id: string().nullable().optional(),
        read_set2_id: string().nullable().optional(),
        sample_id: string().required(),
        uri: string().nullable().optional(),
      })
      .test('valid-sequence-source', t`Use either a URI or a file, and choose a file format when using a file`, values => {
        if (values?.uri && values.file_id) {
          return false;
        }
        return !values?.file_id || values.file_format !== undefined;
      })
      .test('distinct-read-sets', t`Forward and reverse read sets must be different`, values => {
        return !values?.read_set_id || !values.read_set2_id || values.read_set_id !== values.read_set2_id;
      });
  }, [t]);

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
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`Code`,
      name: 'code',
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`URI`,
      name: 'uri',
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`File`,
      loading: fileOptionsQuery.isLoading,
      name: 'file_id',
      options: fileOptionsQuery.options,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`File format`,
      name: 'file_format',
      options: seqFileFormatOptionsQuery.options,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`File compression`,
      name: 'file_compression',
      options: fileCompressionOptionsQuery.options,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`File hash`,
      name: 'file_hash',
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Read set`,
      loading: readSetOptionsQuery.isLoading,
      name: 'read_set_id',
      options: readSetOptionsQuery.options,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Second read set`,
      loading: readSetOptionsQuery.isLoading,
      name: 'read_set2_id',
      options: readSetOptionsQuery.options,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      label: t`Protocol`,
      loading: protocolOptionsQuery.isLoading,
      name: 'protocol_id',
      options: protocolOptionsQuery.options,
    } as const satisfies FormFieldDefinition<FormFields>,
    {
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`Contigs (JSON)`,
      multiline: true,
      name: 'contigs_json',
      required: true,
      rows: 10,
    } as const satisfies FormFieldDefinition<FormFields>,
  ], [
    fileCompressionOptionsQuery.options,
    fileOptionsQuery.isLoading,
    fileOptionsQuery.options,
    protocolOptionsQuery.isLoading,
    protocolOptionsQuery.options,
    readSetOptionsQuery.isLoading,
    readSetOptionsQuery.options,
    sampleOptionsQuery.isLoading,
    sampleOptionsQuery.options,
    seqFileFormatOptionsQuery.options,
    t,
  ]);

  const tableColumns = useMemo((): TableColumn<SeqDbSeqWithId>[] => [
    TableUtil.createTextColumn<SeqDbSeqWithId>({ id: 'code', name: t`Code` }),
    TableUtil.createTextColumn<SeqDbSeqWithId>({ id: 'seq_hash', name: t`Sequence hash` }),
    TableUtil.createOptionsColumn<SeqDbSeqWithId>({
      id: 'sample_id',
      name: t`Sample`,
      options: sampleOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqWithId>({ id: 'uri', name: t`URI` }),
    TableUtil.createOptionsColumn<SeqDbSeqWithId>({
      id: 'file_id',
      name: t`File`,
      options: fileOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqWithId>({
      id: 'file_format',
      name: t`File format`,
      options: seqFileFormatOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqWithId>({
      id: 'file_compression',
      name: t`File compression`,
      options: fileCompressionOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqWithId>({ id: 'file_hash', name: t`File hash` }),
    TableUtil.createOptionsColumn<SeqDbSeqWithId>({
      id: 'read_set_id',
      name: t`Read set`,
      options: readSetOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqWithId>({
      id: 'read_set2_id',
      name: t`Second read set`,
      options: readSetOptionsQuery.options,
    }),
    TableUtil.createOptionsColumn<SeqDbSeqWithId>({
      id: 'protocol_id',
      name: t`Protocol`,
      options: protocolOptionsQuery.options,
    }),
  ], [
    fileCompressionOptionsQuery.options,
    fileOptionsQuery.options,
    protocolOptionsQuery.options,
    readSetOptionsQuery.options,
    sampleOptionsQuery.options,
    seqFileFormatOptionsQuery.options,
    t,
  ]);

  const canEditItem = useCallback((item: SeqDbSeqWithId) => !item.contigs?.length, []);

  return (
    <CrudPage<FormFields, SeqDbSeqWithId, SeqDbSeqWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      canEditItem={canEditItem}
      createItemDialogTitle={t`Create new sequence`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqCrudCommand}
      defaultNewItem={{ contigs_json: '[]' }}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getFormValuesFromItem={getFormValuesFromItem}
      getName={getName}
      itemName={t`Sequence`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqsAdminPage')}
      title={t`Sequences`}
      updateOne={updateOne}
    />
  );
};
