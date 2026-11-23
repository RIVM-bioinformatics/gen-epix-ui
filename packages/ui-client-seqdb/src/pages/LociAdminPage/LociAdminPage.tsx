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
  SeqDbLocus,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbLocusType,
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
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { useLocusTypeOptionsQuery } from '../../dataHooks/useLocusTypesQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbLocus>;
type SeqDbLocusWithId = { id: string } & SeqDbLocus;

const isLocusWithId = (locus: SeqDbLocus): locus is SeqDbLocusWithId => {
  return typeof locus.id === 'string' && locus.id.length > 0;
};

const requireLocusId = (locus: SeqDbLocus): SeqDbLocusWithId => {
  if (!isLocusWithId(locus)) {
    throw new Error('SeqDB returned a locus without an ID.');
  }

  return locus;
};

export const LociAdminPage = () => {
  const { t } = useTranslation();
  const locusTypeOptionsQuery = useLocusTypeOptionsQuery();
  const loadables = useArray([locusTypeOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).lociGetAll(null, null, { signal });
    return response.data.map(requireLocusId);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return requireLocusId((await container.resolve(SeqDbSeqApi).lociPostOne(variables)).data);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbLocusWithId) => {
    /* v8 ignore next -- fetched and created loci always have an id (requireLocusId), and validated create values always have a required code, so the empty fallback is unreachable */
    return item.name || item.code || ('id' in item && item.id) || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>()
      .shape({
        code: SchemaUtil.code,
        description: SchemaUtil.description.nullable().optional(),
        gene_product_code: string().nullable().optional(),
        locus_type: mixed<SeqDbLocusType>().oneOf(Object.values(SeqDbLocusType)).optional(),
        name: SchemaUtil.name.nullable().optional(),
      })
      .test(
        'gene-product-code-requires-gene',
        'Gene product code is only allowed for gene loci.',
        item => !item?.gene_product_code || item.locus_type === SeqDbLocusType.GENE,
      );
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
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Locus type`,
        name: 'locus_type',
        options: locusTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Gene product code`,
        name: 'gene_product_code',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [locusTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbLocusWithId>[] => {
    return [
      TableUtil.createTextColumn<SeqDbLocusWithId>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbLocusWithId>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<SeqDbLocusWithId>({ flex: 2, id: 'description', name: t`Description` }),
      TableUtil.createOptionsColumn<SeqDbLocusWithId>({ id: 'locus_type', name: t`Locus type`, options: locusTypeOptionsQuery.options }),
      TableUtil.createTextColumn<SeqDbLocusWithId>({ id: 'gene_product_code', name: t`Gene product code` }),
    ];
  }, [locusTypeOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbLocusWithId, SeqDbLocusWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new locus`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.LocusCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Locus`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.LOCI}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('LociAdminPage')}
      title={t`Loci`}
    />
  );
};
