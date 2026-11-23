import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  number,
  object,
  string,
} from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbSeqApi,
  SeqDbGenEpixSeqdbDomainTreeAlgorithm as SeqDbTreeAlgorithmValues,
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

import { useTreeAlgorithmClassOptionsQuery } from '../../dataHooks/useTreeAlgorithmClassesQuery';
import { useTreeAlgorithmCodeOptionsQuery } from '../../dataHooks/useTreeAlgorithmCodeOptionsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<
  SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm,
  'tree_algorithm_class'
>;

export const TreeAlgorithmsAdminPage = () => {
  const { t } = useTranslation();
  const treeAlgorithmClassOptionsQuery = useTreeAlgorithmClassOptionsQuery();
  const treeAlgorithmCodeOptionsQuery = useTreeAlgorithmCodeOptionsQuery();
  const loadables = useArray([treeAlgorithmClassOptionsQuery, treeAlgorithmCodeOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).treeAlgorithmsGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).treeAlgorithmsPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm) => {
    /* v8 ignore start -- CrudPage only calls updateOne for items with a truthy id (items without one are created instead), so this guard is unreachable through the page */
    if (!item.id) {
      throw new Error('Cannot update a tree algorithm without an ID.');
    }
    /* v8 ignore stop */

    return (await container.resolve(SeqDbSeqApi).treeAlgorithmsPutOne(item.id, { ...variables, id: item.id })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm) => {
    if (!item.id) {
      throw new Error('Cannot delete a tree algorithm without an ID.');
    }

    return container.resolve(SeqDbSeqApi).treeAlgorithmsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm) => {
    return item.name || item.code || ('id' in item && item.id) || '';
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: string().oneOf(Object.values(SeqDbTreeAlgorithmValues)).required(),
      description: string().nullable().optional().max(1000),
      is_ultrametric: boolean().required(),
      name: SchemaUtil.name,
      rank: number().nullable().optional().integer().min(0),
      tree_algorithm_class_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Algorithm code`,
        name: 'code',
        options: treeAlgorithmCodeOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 4,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Tree algorithm class`,
        loading: treeAlgorithmClassOptionsQuery.isLoading,
        name: 'tree_algorithm_class_id',
        options: treeAlgorithmClassOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
        label: t`Ultrametric`,
        name: 'is_ultrametric',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Rank`,
        name: 'rank',
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [t, treeAlgorithmClassOptionsQuery.isLoading, treeAlgorithmClassOptionsQuery.options, treeAlgorithmCodeOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>[] => {
    return [
      TableUtil.createOptionsColumn<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>({ id: 'code', name: t`Algorithm code`, options: treeAlgorithmCodeOptionsQuery.options }),
      TableUtil.createTextColumn<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>({ id: 'tree_algorithm_class_id', name: t`Tree algorithm class`, options: treeAlgorithmClassOptionsQuery.options }),
      TableUtil.createBooleanColumn<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>({ id: 'is_ultrametric', name: t`Ultrametric` }),
      TableUtil.createNumberColumn<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>({ id: 'rank', name: t`Rank` }),
    ];
  }, [t, treeAlgorithmClassOptionsQuery.options, treeAlgorithmCodeOptionsQuery.options]);

  return (
    <CrudPage<FormFields, SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm, SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new tree algorithm`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.TreeAlgorithmCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Tree algorithm`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.TREE_ALGORITHMS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('TreeAlgorithmsAdminPage')}
      title={t`Tree algorithms`}
      updateOne={updateOne}
    />
  );
};
