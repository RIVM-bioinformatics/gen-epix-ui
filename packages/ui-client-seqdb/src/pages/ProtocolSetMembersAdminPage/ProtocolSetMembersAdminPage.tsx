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
  SeqDbProtocolSetMember,
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

import { useProtocolOptionsQuery } from '../../dataHooks/useProtocolsQuery';
import { useProtocolSetOptionsQuery } from '../../dataHooks/useProtocolSetsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbProtocolSetMember, 'protocol_set' | 'protocol'>;

export const ProtocolSetMembersAdminPage = () => {
  const { t } = useTranslation();
  const protocolOptionsQuery = useProtocolOptionsQuery();
  const protocolSetOptionsQuery = useProtocolSetOptionsQuery();
  const loadables = useArray([protocolOptionsQuery, protocolSetOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).protocolSetMembersGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).protocolSetMembersPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbProtocolSetMember) => {
    /* v8 ignore start -- CrudPage only calls updateOne for items with a truthy id (items without one are created instead), so this guard is unreachable through the page */
    if (!item.id) {
      throw new Error('Cannot update a protocol set member without an ID.');
    }
    /* v8 ignore stop */

    return (await container.resolve(SeqDbSeqApi).protocolSetMembersPutOne(item.id, { ...variables, id: item.id })).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbProtocolSetMember) => {
    if (!item.id) {
      throw new Error('Cannot delete a protocol set member without an ID.');
    }

    return container.resolve(SeqDbSeqApi).protocolSetMembersDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbProtocolSetMember) => {
    const protocolSetName = protocolSetOptionsQuery.options.find(option => option.value === item.protocol_set_id)?.label || item.protocol_set_id || '';
    const protocolName = protocolOptionsQuery.options.find(option => option.value === item.protocol_id)?.label || item.protocol_id || '';
    const name = [protocolSetName, protocolName].filter(Boolean).join(' - ');
    return name || ('id' in item && item.id) || '';
  }, [protocolOptionsQuery.options, protocolSetOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      protocol_id: string().required(),
      protocol_set_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Protocol set`,
        loading: protocolSetOptionsQuery.isLoading,
        name: 'protocol_set_id',
        options: protocolSetOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Protocol`,
        loading: protocolOptionsQuery.isLoading,
        name: 'protocol_id',
        options: protocolOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [protocolOptionsQuery.isLoading, protocolOptionsQuery.options, protocolSetOptionsQuery.isLoading, protocolSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbProtocolSetMember>[] => {
    return [
      TableUtil.createOptionsColumn<SeqDbProtocolSetMember>({ id: 'protocol_set_id', name: t`Protocol set`, options: protocolSetOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbProtocolSetMember>({ id: 'protocol_id', name: t`Protocol`, options: protocolOptionsQuery.options }),
    ];
  }, [protocolOptionsQuery.options, protocolSetOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbProtocolSetMember, SeqDbProtocolSetMember, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new protocol set member`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.ProtocolSetMemberCrudCommand}
      defaultSortByField={'protocol_set_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Protocol set member`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.PROTOCOL_SET_MEMBERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ProtocolSetMembersAdminPage')}
      title={t`Protocol set members`}
      updateOne={updateOne}
    />
  );
};
