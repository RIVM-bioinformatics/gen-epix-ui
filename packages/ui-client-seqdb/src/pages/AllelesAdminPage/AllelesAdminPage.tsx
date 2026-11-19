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
type SeqDbAlleleWithId = { id: string } & SeqDbAllele;

const isAlleleWithId = (allele: SeqDbAllele): allele is SeqDbAlleleWithId => {
  return typeof allele.id === 'string' && allele.id.length > 0;
};

const requireAlleleId = (allele: SeqDbAllele): SeqDbAlleleWithId => {
  if (!isAlleleWithId(allele)) {
    throw new Error('SeqDB returned an allele without an ID.');
  }

  return allele;
};

export const AllelesAdminPage = () => {
  const { t } = useTranslation();
  const locusOptionsQuery = useLocusOptionsQuery();
  const seqFormatOptionsQuery = useSeqFormatOptionsQuery();
  const loadables = useArray([locusOptionsQuery, seqFormatOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).allelesGetAll(null, null, { signal });
    return response.data.map(requireAlleleId);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return requireAlleleId((await container.resolve(SeqDbSeqApi).allelesPostOne(variables)).data);
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

  const tableColumns = useMemo((): TableColumn<SeqDbAlleleWithId>[] => {
    return [
      TableUtil.createTextColumn<SeqDbAlleleWithId>({ flex: 2, id: 'seq', name: t`Sequence` }),
      TableUtil.createOptionsColumn<SeqDbAlleleWithId>({ id: 'seq_format', name: t`Sequence format`, options: seqFormatOptionsQuery.options }),
      TableUtil.createNumberColumn<SeqDbAlleleWithId>({ id: 'length', name: t`Length` }),
      TableUtil.createOptionsColumn<SeqDbAlleleWithId>({ id: 'locus_id', name: t`Locus`, options: locusOptionsQuery.options }),
    ];
  }, [locusOptionsQuery.options, seqFormatOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbAlleleWithId, SeqDbAlleleWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
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
