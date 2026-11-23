import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbSeqCategorySet,
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

type FormFields = OmitWithMetaData<SeqDbSeqCategorySet>;

export const SeqCategorySetsAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).seqCategorySetsGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).seqCategorySetsPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqCategorySet) => {
    /* v8 ignore next 3 -- CrudPage only calls updateOne for rows with a truthy id */
    if (!item.id) {
      throw new Error('Cannot update a sequence category set without an ID.');
    }

    return (await container.resolve(SeqDbSeqApi).seqCategorySetsPutOne(item.id, { ...variables, id: item.id })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqCategorySet) => {
    if (!item.id) {
      throw new Error('Cannot delete a sequence category set without an ID.');
    }

    return container.resolve(SeqDbSeqApi).seqCategorySetsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqCategorySet) => {
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

  const tableColumns = useMemo((): TableColumn<SeqDbSeqCategorySet>[] => {
    return [
      TableUtil.createTextColumn<SeqDbSeqCategorySet>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbSeqCategorySet>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, SeqDbSeqCategorySet, SeqDbSeqCategorySet, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence category set`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqCategorySetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence category set`}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_CATEGORY_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqCategorySetsAdminPage')}
      title={t`Sequence category sets`}
      updateOne={updateOne}
    />
  );
};
