import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  number,
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbFileCompression,
  SeqDbQualityControlResult,
  SeqDbReadSet,
  SeqDbReadsFileFormat,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbFileCompression as SeqDbFileCompressionValues,
  SeqDbQualityControlResult as SeqDbQualityControlResultValues,
  SeqDbReadsFileFormat as SeqDbReadsFileFormatValues,
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

import { useFileOptionsQuery } from '../../dataHooks/useFilesQuery';
import { useSampleOptionsQuery } from '../../dataHooks/useSamplesQuery';
import { useProtocolOptionsQuery } from '../../dataHooks/useProtocolsQuery';
import { useQualityControlResultOptionsQuery } from '../../dataHooks/useQualityControlResultOptionsQuery';
import { useReadsFileFormatOptionsQuery } from '../../dataHooks/useReadsFileFormatOptionsQuery';
import { useFileCompressionOptionsQuery } from '../../dataHooks/useFileCompressionOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbReadSet, 'fwd_file' | 'protocol' | 'qc_report' | 'rev_file' | 'sample'>;

const requireId = (id: SeqDbReadSet['id']): string => {
  if (!id) {
    throw new Error('Cannot update or delete a read set without an ID.');
  }
  return id;
};

export const ReadSetsAdminPage = () => {
  const { t } = useTranslation();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const fileOptionsQuery = useFileOptionsQuery();
  const qualityControlResultOptionsQuery = useQualityControlResultOptionsQuery();
  const readsFileFormatOptionsQuery = useReadsFileFormatOptionsQuery();
  const fileCompressionOptionsQuery = useFileCompressionOptionsQuery();
  const loadables = useArray([
    sampleOptionsQuery,
    protocolOptionsQuery,
    fileOptionsQuery,
    qualityControlResultOptionsQuery,
    readsFileFormatOptionsQuery,
    fileCompressionOptionsQuery,
  ]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).readSetsGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).readSetsPostOne(variables);
    return response.data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbReadSet) => {
    return (await container.resolve(SeqDbSeqApi).readSetsPutOne(
      requireId(item.id),
      { ...variables, id: requireId(item.id), qc_report: item.qc_report as unknown },
    )).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbReadSet) => {
    return container.resolve(SeqDbSeqApi).readSetsDeleteOne(requireId(item.id));
  }, []);

  const getName = useCallback((item: FormFields | SeqDbReadSet) => {
    const code = item.code?.trim();
    const sampleName = sampleOptionsQuery.options.find(option => option.value === item.sample_id)?.label;
    return code || sampleName || item.sample_id || ('id' in item && item.id) || '';
  }, [sampleOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: string().nullable().optional(),
      file_compression: mixed<SeqDbFileCompression>().oneOf(Object.values(SeqDbFileCompressionValues)).optional(),
      file_format: mixed<SeqDbReadsFileFormat>().oneOf(Object.values(SeqDbReadsFileFormatValues)).optional(),
      fwd_file_id: string().nullable().optional(),
      fwd_reads_hash: string().nullable().optional(),
      fwd_uri: string().nullable().optional(),
      protocol_id: string().required(),
      qc_result_human: mixed<SeqDbQualityControlResult>().oneOf(Object.values(SeqDbQualityControlResultValues)).optional(),
      qc_result_machine: mixed<SeqDbQualityControlResult>().oneOf(Object.values(SeqDbQualityControlResultValues)).optional(),
      qc_score: number().nullable().optional(),
      rev_file_id: string().nullable().optional(),
      rev_reads_hash: string().nullable().optional(),
      rev_uri: string().nullable().optional(),
      sample_id: string().required(),
      sequencing_run_code: string().nullable().optional(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
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
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Sequencing run code`,
        name: 'sequencing_run_code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Forward URI`,
        name: 'fwd_uri',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Reverse URI`,
        name: 'rev_uri',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Forward file`,
        loading: fileOptionsQuery.isLoading,
        name: 'fwd_file_id',
        options: fileOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Reverse file`,
        loading: fileOptionsQuery.isLoading,
        name: 'rev_file_id',
        options: fileOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`File format`,
        name: 'file_format',
        options: readsFileFormatOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`File compression`,
        name: 'file_compression',
        options: fileCompressionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Forward reads hash`,
        name: 'fwd_reads_hash',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Reverse reads hash`,
        name: 'rev_reads_hash',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Machine quality-control result`,
        name: 'qc_result_machine',
        options: qualityControlResultOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Human quality-control result`,
        name: 'qc_result_human',
        options: qualityControlResultOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Quality-control score`,
        name: 'qc_score',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [fileCompressionOptionsQuery.options, fileOptionsQuery.isLoading, fileOptionsQuery.options, protocolOptionsQuery.isLoading, protocolOptionsQuery.options, qualityControlResultOptionsQuery.options, readsFileFormatOptionsQuery.options, sampleOptionsQuery.isLoading, sampleOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbReadSet>[] => {
    return [
      TableUtil.createTextColumn<SeqDbReadSet>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'sample_id', name: t`Sample`, options: sampleOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'protocol_id', name: t`Protocol`, options: protocolOptionsQuery.options }),
      TableUtil.createTextColumn<SeqDbReadSet>({ id: 'sequencing_run_code', name: t`Sequencing run code` }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'fwd_file_id', name: t`Forward file`, options: fileOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'rev_file_id', name: t`Reverse file`, options: fileOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'file_format', name: t`File format`, options: readsFileFormatOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'file_compression', name: t`File compression`, options: fileCompressionOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'qc_result_machine', name: t`Machine quality-control result`, options: qualityControlResultOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbReadSet>({ id: 'qc_result_human', name: t`Human quality-control result`, options: qualityControlResultOptionsQuery.options }),
      TableUtil.createNumberColumn<SeqDbReadSet>({ id: 'qc_score', name: t`Quality-control score` }),
    ];
  }, [fileCompressionOptionsQuery.options, fileOptionsQuery.options, protocolOptionsQuery.options, qualityControlResultOptionsQuery.options, readsFileFormatOptionsQuery.options, sampleOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbReadSet, SeqDbReadSet, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new read set`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.ReadSetCrudCommand}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Read set`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.READ_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ReadSetsAdminPage')}
      title={t`Read sets`}
      updateOne={updateOne}
    />
  );
};
