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
  SeqDbAllele,
  SeqDbApiPermission,
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


type FormFields = OmitWithMetaData<SeqDbAllele, 'length' | 'locus'>;

export const AllelesAdminPage = () => {
  const { t } = useTranslation();
  const locusOptionsQuery = useLocusOptionsQuery();
  const seqFormatOptionsQuery = useSeqFormatOptionsQuery();
  const loadables = useArray([locusOptionsQuery, seqFormatOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).allelesGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).allelesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: FormFields | SeqDbAllele) => {
    return item.seq || ('id' in item && item.id) || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
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

  const tableColumns = useMemo((): TableColumn<SeqDbAllele>[] => {
    return [
      TableUtil.createTextColumn<SeqDbAllele>({ flex: 2, id: 'seq', name: t`Sequence` }),
      TableUtil.createOptionsColumn<SeqDbAllele>({ id: 'seq_format', name: t`Sequence format`, options: seqFormatOptionsQuery.options }),
      TableUtil.createNumberColumn<SeqDbAllele>({ id: 'length', name: t`Length` }),
      TableUtil.createOptionsColumn<SeqDbAllele>({ id: 'locus_id', name: t`Locus`, options: locusOptionsQuery.options }),
    ];
  }, [locusOptionsQuery.options, seqFormatOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbAllele, SeqDbAllele, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new allele`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.AlleleCrudCommand}
      defaultSortByField={'seq'}
      defaultSortDirection={'asc'}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Allele`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.ALLELES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('AllelesAdminPage')}
      title={t`Alleles`}
    />
  );
};
