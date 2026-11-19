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
  SeqDbPcrMeasurement,
  SeqDbQualityControlResult,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbQualityControlResult as SeqDbQualityControlResultValues,
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

import { useSampleOptionsQuery } from '../../dataHooks/useSamplesQuery';
import { useProtocolOptionsQuery } from '../../dataHooks/useProtocolsQuery';
import { useQualityControlResultOptionsQuery } from '../../dataHooks/useQualityControlResultOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbPcrMeasurement, 'protocol' | 'qc_report' | 'sample'>;

const requireId = (id: SeqDbPcrMeasurement['id']): string => {
  if (!id) {
    throw new Error('Cannot update or delete a PCR measurement without an ID.');
  }
  return id;
};

export const PcrMeasurementsAdminPage = () => {
  const { t } = useTranslation();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const qualityControlResultOptionsQuery = useQualityControlResultOptionsQuery();
  const loadables = useArray([sampleOptionsQuery, protocolOptionsQuery, qualityControlResultOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).pcrMeasurementsGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).pcrMeasurementsPostOne(variables);
    return response.data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbPcrMeasurement) => {
    return (await container.resolve(SeqDbSeqApi).pcrMeasurementsPutOne(
      requireId(item.id),
      { ...variables, id: requireId(item.id), qc_report: item.qc_report as unknown },
    )).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbPcrMeasurement) => {
    return container.resolve(SeqDbSeqApi).pcrMeasurementsDeleteOne(requireId(item.id));
  }, []);

  const getName = useCallback((item: FormFields | SeqDbPcrMeasurement) => {
    const sampleName = sampleOptionsQuery.options.find(option => option.value === item.sample_id)?.label ?? item.sample_id;
    const protocolName = protocolOptionsQuery.options.find(option => option.value === item.protocol_id)?.label ?? item.protocol_id;
    return [sampleName, protocolName].filter(Boolean).join(' - ') || ('id' in item && item.id) || '';
  }, [protocolOptionsQuery.options, sampleOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      content: string().required(),
      content_hash: string().required(),
      content2: string().nullable().optional(),
      format: string().required(),
      protocol_id: string().required(),
      qc_result_human: mixed<SeqDbQualityControlResult>().oneOf(Object.values(SeqDbQualityControlResultValues)).optional(),
      qc_result_machine: mixed<SeqDbQualityControlResult>().oneOf(Object.values(SeqDbQualityControlResultValues)).optional(),
      qc_score: number().nullable().optional(),
      sample_id: string().required(),
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
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Additional content`,
        multiline: true,
        name: 'content2',
        rows: 3,
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
  }, [protocolOptionsQuery.isLoading, protocolOptionsQuery.options, qualityControlResultOptionsQuery.options, sampleOptionsQuery.isLoading, sampleOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbPcrMeasurement>[] => {
    return [
      TableUtil.createOptionsColumn<SeqDbPcrMeasurement>({ id: 'sample_id', name: t`Sample`, options: sampleOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbPcrMeasurement>({ id: 'protocol_id', name: t`Protocol`, options: protocolOptionsQuery.options }),
      TableUtil.createTextColumn<SeqDbPcrMeasurement>({ id: 'format', name: t`Format` }),
      TableUtil.createTextColumn<SeqDbPcrMeasurement>({ id: 'content_hash', name: t`Content hash` }),
      TableUtil.createOptionsColumn<SeqDbPcrMeasurement>({ id: 'qc_result_machine', name: t`Machine quality-control result`, options: qualityControlResultOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbPcrMeasurement>({ id: 'qc_result_human', name: t`Human quality-control result`, options: qualityControlResultOptionsQuery.options }),
      TableUtil.createNumberColumn<SeqDbPcrMeasurement>({ id: 'qc_score', name: t`Quality-control score` }),
    ];
  }, [protocolOptionsQuery.options, qualityControlResultOptionsQuery.options, sampleOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbPcrMeasurement, SeqDbPcrMeasurement, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new PCR measurement`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.PcrMeasurementCrudCommand}
      defaultSortByField={'sample_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`PCR measurement`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.PCR_MEASUREMENTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('PcrMeasurementsAdminPage')}
      title={t`PCR measurements`}
      updateOne={updateOne}
    />
  );
};
