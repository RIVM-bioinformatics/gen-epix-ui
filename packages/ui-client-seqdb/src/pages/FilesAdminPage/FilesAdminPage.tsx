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
  SeqDbModelFile,
} from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbFileApi,
} from '@gen-epix/api-seqdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbModelFile>;
type SeqDbModelFileWithId = { id: string } & SeqDbModelFile;

const isSeqDbModelFileWithId = (item: unknown): item is SeqDbModelFileWithId => {
  return typeof item === 'object'
    && item !== null
    && 'id' in item
    && typeof item.id === 'string'
    && item.id.length > 0
    && 'content' in item
    && typeof item.content === 'string';
};

const requireFileId = (item: unknown): SeqDbModelFileWithId => {
  if (!isSeqDbModelFileWithId(item)) {
    throw new Error('SeqDB returned a file without an ID or content.');
  }
  return item;
};

export const FilesAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbFileApi).filesGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbModelFileWithId)) {
      throw new Error('SeqDB returned a file without an ID or content.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbFileApi).filesPostOne(variables);
    return requireFileId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbModelFileWithId) => {
    const response = await container.resolve(SeqDbFileApi).filesPutOne(item.id, {
      ...variables,
      id: item.id,
    });

    return requireFileId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbModelFileWithId) => {
    return container.resolve(SeqDbFileApi).filesDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbModelFileWithId) => {
    return ('id' in item && item.id) || item.content.slice(0, 60);
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      content: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
    {
      definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
      label: t`Content`,
      multiline: true,
      name: 'content',
      required: true,
      rows: 8,
    } as const satisfies FormFieldDefinition<FormFields>,
  ], [t]);

  const tableColumns = useMemo((): TableColumn<SeqDbModelFileWithId>[] => [
    TableUtil.createTextColumn<SeqDbModelFileWithId>({ flex: 2, id: 'content', name: t`Content` }),
  ], [t]);

  return (
    <CrudPage<FormFields, SeqDbModelFileWithId, SeqDbModelFileWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new file`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.FileCrudCommand}
      defaultSortByField={'id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`File`}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.FILES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('FilesAdminPage')}
      title={t`Files`}
      updateOne={updateOne}
    />
  );
};
