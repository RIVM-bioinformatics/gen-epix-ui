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
  SeqDbRefSeq,
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
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { useSeqFormatOptionsQuery } from '../../dataHooks/useSeqFormatsQuery';
import { useTaxonOptionsQuery } from '../../dataHooks/useTaxaQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbRefSeq, 'length' | 'taxon'>;
type SeqDbRefSeqWithId = { id: string } & SeqDbRefSeq;

const isRefSeqWithId = (refSeq: SeqDbRefSeq): refSeq is SeqDbRefSeqWithId => {
  return typeof refSeq.id === 'string' && refSeq.id.length > 0;
};

const requireRefSeqId = (refSeq: SeqDbRefSeq): SeqDbRefSeqWithId => {
  if (!isRefSeqWithId(refSeq)) {
    throw new Error('SeqDB returned a reference sequence without an ID.');
  }

  return refSeq;
};

export const RefSeqsAdminPage = () => {
  const { t } = useTranslation();
  const seqFormatOptionsQuery = useSeqFormatOptionsQuery();
  const taxonOptionsQuery = useTaxonOptionsQuery();
  const loadables = useArray([seqFormatOptionsQuery, taxonOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).refSeqsGetAll(null, null, { signal });
    return response.data.map(requireRefSeqId);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return requireRefSeqId((await container.resolve(SeqDbSeqApi).refSeqsPostOne(variables)).data);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbRefSeqWithId) => {
    return item.name || item.code || ('id' in item && item.id) || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      description: SchemaUtil.description.nullable().optional(),
      genbank_accession_code: string().nullable().optional(),
      name: SchemaUtil.name,
      seq: string().required(),
      seq_format: mixed<SeqDbSeqFormat>().oneOf(Object.values(SeqDbSeqFormat)).optional(),
      taxon_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Taxon`,
        loading: taxonOptionsQuery.isLoading,
        name: 'taxon_id',
        options: taxonOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`GenBank accession code`,
        name: 'genbank_accession_code',
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
  }, [seqFormatOptionsQuery.options, taxonOptionsQuery.isLoading, taxonOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbRefSeqWithId>[] => {
    return [
      TableUtil.createTextColumn<SeqDbRefSeqWithId>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbRefSeqWithId>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<SeqDbRefSeqWithId>({ id: 'taxon_id', name: t`Taxon`, options: taxonOptionsQuery.options }),
      TableUtil.createTextColumn<SeqDbRefSeqWithId>({ id: 'genbank_accession_code', name: t`GenBank accession code` }),
      TableUtil.createOptionsColumn<SeqDbRefSeqWithId>({ id: 'seq_format', name: t`Sequence format`, options: seqFormatOptionsQuery.options }),
      TableUtil.createNumberColumn<SeqDbRefSeqWithId>({ id: 'length', name: t`Length` }),
      TableUtil.createTextColumn<SeqDbRefSeqWithId>({ flex: 2, id: 'seq', name: t`Sequence` }),
      TableUtil.createTextColumn<SeqDbRefSeqWithId>({ flex: 2, id: 'description', name: t`Description` }),
    ];
  }, [seqFormatOptionsQuery.options, taxonOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbRefSeqWithId, SeqDbRefSeqWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new reference sequence`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.RefSeqCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Reference sequence`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.REF_SEQS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RefSeqsAdminPage')}
      title={t`Reference sequences`}
    />
  );
};
