import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbTaxonSet,
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
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbTaxonSet>;

export const TaxonSetsAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).taxonSetsGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).taxonSetsPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbTaxonSet) => {
    /* v8 ignore start -- CrudPage only calls updateOne for items with a truthy id (items without one are created instead), so this guard is unreachable through the page */
    if (!item.id) {
      throw new Error('Cannot update a taxon set without an ID.');
    }
    /* v8 ignore stop */

    return (await container.resolve(SeqDbSeqApi).taxonSetsPutOne(item.id, { ...variables, id: item.id })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbTaxonSet) => {
    if (!item.id) {
      throw new Error('Cannot delete a taxon set without an ID.');
    }

    return container.resolve(SeqDbSeqApi).taxonSetsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbTaxonSet) => {
    return item.name || ('id' in item && item.id) || item.code || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      name: SchemaUtil.name,
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
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<SeqDbTaxonSet>[] => {
    return [
      TableUtil.createTextColumn<SeqDbTaxonSet>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbTaxonSet>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, SeqDbTaxonSet, SeqDbTaxonSet, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new taxon set`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.TaxonSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Taxon set`}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.TAXON_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('TaxonSetsAdminPage')}
      title={t`Taxon sets`}
      updateOne={updateOne}
    />
  );
};
