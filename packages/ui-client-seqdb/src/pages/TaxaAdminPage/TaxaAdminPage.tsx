import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  mixed,
  number,
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbTaxon,
  SeqDbTaxonRank,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
  SeqDbTaxonRank as SeqDbTaxonRankValues,
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

import { useTaxonOptionsQuery } from '../../dataHooks/useTaxaQuery';
import { useTaxonRankOptionsQuery } from '../../dataHooks/useTaxonRankOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = {
  ncbiAncestorTaxidsJson: string;
} & OmitWithMetaData<SeqDbTaxon, 'ncbi_ancestor_taxids'>;

const parseNcbiAncestorTaxids = (taxidsJson: string): number[] => {
  const parsedTaxids: unknown = JSON.parse(taxidsJson);
  /* v8 ignore start -- createOne/updateOne only run after the valid-taxid-array schema test accepted the same string, so this guard is unreachable through the form */
  if (!Array.isArray(parsedTaxids) || !parsedTaxids.every(taxid => typeof taxid === 'number' && Number.isInteger(taxid) && taxid > 0)) {
    throw new Error('NCBI ancestor tax IDs must be a JSON array of numbers.');
  }
  /* v8 ignore stop */
  return parsedTaxids as number[];
};

export const TaxaAdminPage = () => {
  const { t } = useTranslation();
  const taxonOptionsQuery = useTaxonOptionsQuery();
  const taxonRankOptionsQuery = useTaxonRankOptionsQuery();
  const loadables = useArray([taxonOptionsQuery, taxonRankOptionsQuery]);
  const defaultNewItem = useMemo<Partial<FormFields>>(() => ({
    ancestor_taxon_ids: [],
    ncbiAncestorTaxidsJson: '[]',
  }), []);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).taxaGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const { ncbiAncestorTaxidsJson, ...taxon } = variables;
    return (await container.resolve(SeqDbSeqApi).taxaPostOne({
      ...taxon,
      ncbi_ancestor_taxids: parseNcbiAncestorTaxids(ncbiAncestorTaxidsJson),
    })).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbTaxon) => {
    /* v8 ignore start -- CrudPage only calls updateOne for items with a truthy id (items without one are created instead), so this guard is unreachable through the page */
    if (!item.id) {
      throw new Error('Cannot update a taxon without an ID.');
    }
    /* v8 ignore stop */

    const { ncbiAncestorTaxidsJson, ...taxon } = variables;
    return (await container.resolve(SeqDbSeqApi).taxaPutOne(item.id, {
      ...taxon,
      id: item.id,
      ncbi_ancestor_taxids: parseNcbiAncestorTaxids(ncbiAncestorTaxidsJson),
    })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbTaxon) => {
    if (!item.id) {
      throw new Error('Cannot delete a taxon without an ID.');
    }

    return container.resolve(SeqDbSeqApi).taxaDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbTaxon) => {
    return item.name || item.code || ('id' in item && item.id) || '';
  }, []);

  const getFormValuesFromItem = useCallback((item?: SeqDbTaxon): Partial<FormFields> => {
    return {
      ...item,
      ancestor_taxon_ids: item?.ancestor_taxon_ids ?? [],
      ncbiAncestorTaxidsJson: JSON.stringify(item?.ncbi_ancestor_taxids ?? [], null, 2),
    };
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      ancestor_taxon_ids: array().of(string().required()).required(),
      code: SchemaUtil.code,
      ictv_ictv_id: string().nullable().optional(),
      name: SchemaUtil.name,
      ncbi_taxid: number().integer().min(1).nullable().optional(),
      ncbiAncestorTaxidsJson: string().required().test('valid-taxid-array', t`Enter a JSON array of NCBI tax IDs.`, (value) => {
        /* v8 ignore next -- the form always supplies ncbiAncestorTaxidsJson as a string (defaultNewItem and getFormValuesFromItem), so value is never undefined */
        if (value === undefined) {
          return false;
        }

        try {
          const parsedTaxids: unknown = JSON.parse(value);
          return Array.isArray(parsedTaxids) && parsedTaxids.every(taxid => typeof taxid === 'number' && Number.isInteger(taxid) && taxid > 0);
        } catch {
          return false;
        }
      }),
      rank: mixed<SeqDbTaxonRank>().oneOf(Object.values(SeqDbTaxonRankValues)).required(),
      snomed_sctid: number().integer().min(1).nullable().optional(),
    });
  }, [t]);

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
        label: t`Rank`,
        name: 'rank',
        options: taxonRankOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`NCBI tax ID`,
        name: 'ncbi_taxid',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`ICTV ID`,
        name: 'ictv_ictv_id',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`SNOMED CT ID`,
        name: 'snomed_sctid',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`NCBI ancestor tax IDs (JSON array)`,
        multiline: true,
        name: 'ncbiAncestorTaxidsJson',
        required: true,
        rows: 4,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        label: t`Ancestor taxa`,
        loading: taxonOptionsQuery.isLoading,
        name: 'ancestor_taxon_ids',
        options: taxonOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [taxonOptionsQuery.isLoading, taxonOptionsQuery.options, taxonRankOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbTaxon>[] => {
    return [
      TableUtil.createTextColumn<SeqDbTaxon>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbTaxon>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<SeqDbTaxon>({ id: 'rank', name: t`Rank`, options: taxonRankOptionsQuery.options }),
      TableUtil.createNumberColumn<SeqDbTaxon>({ id: 'ncbi_taxid', name: t`NCBI tax ID` }),
      TableUtil.createTextColumn<SeqDbTaxon>({ id: 'ictv_ictv_id', name: t`ICTV ID` }),
      TableUtil.createNumberColumn<SeqDbTaxon>({ id: 'snomed_sctid', name: t`SNOMED CT ID` }),
    ];
  }, [t, taxonRankOptionsQuery.options]);

  return (
    <CrudPage<FormFields, SeqDbTaxon, SeqDbTaxon, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new taxon`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.TaxonCrudCommand}
      defaultNewItem={defaultNewItem}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getFormValuesFromItem={getFormValuesFromItem}
      getName={getName}
      itemName={t`Taxon`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.TAXA}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('TaxaAdminPage')}
      title={t`Taxa`}
      updateOne={updateOne}
    />
  );
};
