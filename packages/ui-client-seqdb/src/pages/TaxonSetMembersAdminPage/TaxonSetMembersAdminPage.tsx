import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbTaxonSetMember,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
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

import { useTaxonOptionsQuery } from '../../dataHooks/useTaxaQuery';
import { useTaxonSetOptionsQuery } from '../../dataHooks/useTaxonSetsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbTaxonSetMember, 'taxon_set' | 'taxon'>;

export const TaxonSetMembersAdminPage = () => {
  const { t } = useTranslation();
  const taxonOptionsQuery = useTaxonOptionsQuery();
  const taxonSetOptionsQuery = useTaxonSetOptionsQuery();
  const loadables = useArray([taxonOptionsQuery, taxonSetOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).taxonSetMembersGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).taxonSetMembersPostOne(variables as SeqDbTaxonSetMember)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbTaxonSetMember) => {
    if (!item.id) {
      throw new Error('Cannot update a taxon set member without an ID.');
    }

    return (await container.resolve(SeqDbSeqApi).taxonSetMembersPutOne(item.id, {
      ...variables,
      id: item.id,
    } as SeqDbTaxonSetMember)).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbTaxonSetMember) => {
    if (!item.id) {
      throw new Error('Cannot delete a taxon set member without an ID.');
    }

    return container.resolve(SeqDbSeqApi).taxonSetMembersDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbTaxonSetMember) => {
    const taxonSetName = taxonSetOptionsQuery.options.find(option => option.value === item.taxon_set_id)?.label || item.taxon_set_id || '';
    const taxonName = taxonOptionsQuery.options.find(option => option.value === item.taxon_id)?.label || item.taxon_id || '';
    const name = [taxonSetName, taxonName].filter(Boolean).join(' - ');
    return name || ('id' in item && item.id) || '';
  }, [taxonOptionsQuery.options, taxonSetOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      taxon_id: string().required(),
      taxon_set_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Taxon set`,
        loading: taxonSetOptionsQuery.isLoading,
        name: 'taxon_set_id',
        options: taxonSetOptionsQuery.options,
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
    ];
  }, [taxonOptionsQuery.isLoading, taxonOptionsQuery.options, taxonSetOptionsQuery.isLoading, taxonSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbTaxonSetMember>[] => {
    return [
      TableUtil.createOptionsColumn<SeqDbTaxonSetMember>({ id: 'taxon_set_id', name: t`Taxon set`, options: taxonSetOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbTaxonSetMember>({ id: 'taxon_id', name: t`Taxon`, options: taxonOptionsQuery.options }),
    ];
  }, [taxonOptionsQuery.options, taxonSetOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbTaxonSetMember, SeqDbTaxonSetMember, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new taxon set member`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.TaxonSetMemberCrudCommand}
      defaultSortByField={'taxon_set_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Taxon set member`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.TAXON_SET_MEMBERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('TaxonSetMembersAdminPage')}
      title={t`Taxon set members`}
      updateOne={updateOne}
    />
  );
};
