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
  SeqDbRefAllele,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
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

import { useLocusOptionsQuery } from '../../dataHooks/useLociQuery';
import { useSeqFormatOptionsQuery } from '../../dataHooks/useSeqFormatsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbRefAllele, 'length' | 'locus'>;
type SeqDbRefAlleleWithId = { id: string } & SeqDbRefAllele;

const isRefAlleleWithId = (refAllele: SeqDbRefAllele): refAllele is SeqDbRefAlleleWithId => {
  return typeof refAllele.id === 'string' && refAllele.id.length > 0;
};

const requireRefAlleleId = (refAllele: SeqDbRefAllele): SeqDbRefAlleleWithId => {
  if (!isRefAlleleWithId(refAllele)) {
    throw new Error('SeqDB returned a reference allele without an ID.');
  }

  return refAllele;
};

export const RefAllelesAdminPage = () => {
  const { t } = useTranslation();
  const locusOptionsQuery = useLocusOptionsQuery();
  const seqFormatOptionsQuery = useSeqFormatOptionsQuery();
  const loadables = useArray([locusOptionsQuery, seqFormatOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).refAllelesGetAll(null, null, { signal });
    return response.data.map(requireRefAlleleId);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return requireRefAlleleId((await container.resolve(SeqDbSeqApi).refAllelesPostOne(variables)).data);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbRefAlleleWithId) => {
    const locusLabel = locusOptionsQuery.options.find(option => option.value === item.locus_id)?.label;
    const locusName = locusLabel || item.locus_id;
    const indexName = Number.isFinite(item.index) ? String(item.index) : '';
    const descriptiveName = [locusName, indexName].filter(Boolean).join(' - ');
    /* v8 ignore next -- the final '' is unreachable: stored items always have a non-empty id (requireRefAlleleId) and create submits require a non-empty seq (schema) */
    return descriptiveName || item.seq || ('id' in item && item.id) || '';
  }, [locusOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      index: number().integer().required(),
      locus_id: string().required(),
      seq: string().required(),
      seq_format: mixed<SeqDbSeqFormat>().oneOf(Object.values(SeqDbSeqFormat)).optional(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Locus`,
        loading: locusOptionsQuery.isLoading,
        name: 'locus_id',
        options: locusOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Index`,
        name: 'index',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Sequence`,
        multiline: true,
        name: 'seq',
        required: true,
        rows: 6,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Sequence format`,
        name: 'seq_format',
        options: seqFormatOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [locusOptionsQuery.isLoading, locusOptionsQuery.options, seqFormatOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbRefAlleleWithId>[] => {
    return [
      TableUtil.createNumberColumn<SeqDbRefAlleleWithId>({ id: 'index', name: t`Index` }),
      TableUtil.createOptionsColumn<SeqDbRefAlleleWithId>({ id: 'locus_id', name: t`Locus`, options: locusOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbRefAlleleWithId>({ id: 'seq_format', name: t`Sequence format`, options: seqFormatOptionsQuery.options }),
      TableUtil.createNumberColumn<SeqDbRefAlleleWithId>({ id: 'length', name: t`Length` }),
      TableUtil.createTextColumn<SeqDbRefAlleleWithId>({ flex: 2, id: 'seq', name: t`Sequence` }),
    ];
  }, [locusOptionsQuery.options, seqFormatOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbRefAlleleWithId, SeqDbRefAlleleWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new reference allele`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.RefAlleleCrudCommand}
      defaultSortByField={'index'}
      defaultSortDirection={'asc'}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Reference allele`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.REF_ALLELES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RefAllelesAdminPage')}
      title={t`Reference alleles`}
    />
  );
};
