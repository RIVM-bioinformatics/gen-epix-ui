import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import type {
  SeqDbApiPermission,
  SeqDbProtocolSet,
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

type FormFields = OmitWithMetaData<SeqDbProtocolSet>;

export const ProtocolSetsAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).protocolSetsGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).protocolSetsPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbProtocolSet) => {
    if (!item.id) {
      throw new Error('Cannot update a protocol set without an ID.');
    }

    return (await container.resolve(SeqDbSeqApi).protocolSetsPutOne(item.id, { ...variables, id: item.id })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbProtocolSet) => {
    if (!item.id) {
      throw new Error('Cannot delete a protocol set without an ID.');
    }

    return container.resolve(SeqDbSeqApi).protocolSetsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbProtocolSet) => {
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

  const tableColumns = useMemo((): TableColumn<SeqDbProtocolSet>[] => {
    return [
      TableUtil.createTextColumn<SeqDbProtocolSet>({ id: 'code', name: t`Code` }),
      TableUtil.createTextColumn<SeqDbProtocolSet>({ id: 'name', name: t`Name` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, SeqDbProtocolSet, SeqDbProtocolSet, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new protocol set`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.ProtocolSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Protocol set`}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.PROTOCOL_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ProtocolSetsAdminPage')}
      title={t`Protocol sets`}
      updateOne={updateOne}
    />
  );
};
