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
  SeqDbSeqCategory,
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
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';

import { useSeqCategorySetOptionsQuery } from '../../dataHooks/useSeqCategorySetsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbSeqCategory, 'seq_category_set'>;

export const SeqCategoriesAdminPage = () => {
  const { t } = useTranslation();
  const seqCategorySetOptionsQuery = useSeqCategorySetOptionsQuery();
  const loadables = useArray([seqCategorySetOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).seqCategoriesGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).seqCategoriesPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqCategory) => {
    if (!item.id) {
      throw new Error('Cannot update a sequence category without an ID.');
    }

    return (await container.resolve(SeqDbSeqApi).seqCategoriesPutOne(item.id, { ...variables, id: item.id })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqCategory) => {
    if (!item.id) {
      throw new Error('Cannot delete a sequence category without an ID.');
    }

    return container.resolve(SeqDbSeqApi).seqCategoriesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqCategory) => {
    return item.name || item.code || ('id' in item && item.id) || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      name: SchemaUtil.name,
      seq_category_set_id: string().required(),
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
        label: t`Sequence category set`,
        loading: seqCategorySetOptionsQuery.isLoading,
        name: 'seq_category_set_id',
        options: seqCategorySetOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [seqCategorySetOptionsQuery.isLoading, seqCategorySetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbSeqCategory>[] => {
    return [
      TableUtil.createTextColumn<SeqDbSeqCategory>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbSeqCategory>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<SeqDbSeqCategory>({ id: 'seq_category_set_id', name: t`Sequence category set`, options: seqCategorySetOptionsQuery.options }),
    ];
  }, [seqCategorySetOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbSeqCategory, SeqDbSeqCategory, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence category`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqCategoryCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence category`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_CATEGORIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqCategoriesAdminPage')}
      title={t`Sequence categories`}
      updateOne={updateOne}
    />
  );
};
