import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbTreeAlgorithmClass,
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

type FormFields = OmitWithMetaData<SeqDbTreeAlgorithmClass>;

export const TreeAlgorithmClassesAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).treeAlgorithmClassesGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).treeAlgorithmClassesPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbTreeAlgorithmClass) => {
    /* v8 ignore start -- CrudPage only calls updateOne for items with a truthy id (items without one are created instead), so this guard is unreachable through the page */
    if (!item.id) {
      throw new Error('Cannot update a tree algorithm class without an ID.');
    }
    /* v8 ignore stop */

    return (await container.resolve(SeqDbSeqApi).treeAlgorithmClassesPutOne(item.id, { ...variables, id: item.id })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbTreeAlgorithmClass) => {
    if (!item.id) {
      throw new Error('Cannot delete a tree algorithm class without an ID.');
    }

    return container.resolve(SeqDbSeqApi).treeAlgorithmClassesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbTreeAlgorithmClass) => {
    return item.name || ('id' in item && item.id) || item.code || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      is_dist_based: SchemaUtil.boolean.required(),
      is_seq_based: SchemaUtil.boolean.required(),
      name: SchemaUtil.name,
      rank: SchemaUtil.rank.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
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
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
        label: t`Sequence-based`,
        name: 'is_seq_based',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
        label: t`Distance-based`,
        name: 'is_dist_based',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Rank`,
        name: 'rank',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<SeqDbTreeAlgorithmClass>[] => {
    return [
      TableUtil.createTextColumn<SeqDbTreeAlgorithmClass>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbTreeAlgorithmClass>({ id: 'name', name: t`Name` }),
      TableUtil.createBooleanColumn<SeqDbTreeAlgorithmClass>({ id: 'is_seq_based', name: t`Sequence-based` }),
      TableUtil.createBooleanColumn<SeqDbTreeAlgorithmClass>({ id: 'is_dist_based', name: t`Distance-based` }),
      TableUtil.createNumberColumn<SeqDbTreeAlgorithmClass>({ id: 'rank', name: t`Rank` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, SeqDbTreeAlgorithmClass, SeqDbTreeAlgorithmClass, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new tree algorithm class`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.TreeAlgorithmClassCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Tree algorithm class`}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.TREE_ALGORITHM_CLASSES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('TreeAlgorithmClassesAdminPage')}
      title={t`Tree algorithm classes`}
      updateOne={updateOne}
    />
  );
};
