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
  SeqDbReadSetIdentifier,
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
import { useIdentifierIssuerOptionsQuery } from '@gen-epix/ui-client-common/dataHooks/useIdentifierIssuerQuery';

import { useReadSetOptionsQuery } from '../../dataHooks/useReadSetsQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbReadSetIdentifier, 'identifier_issuer' | 'read_set'>;

const requireId = (id: SeqDbReadSetIdentifier['id']): string => {
  if (!id) {
    throw new Error('Cannot update or delete a read set identifier without an ID.');
  }
  return id;
};

export const ReadSetIdentifiersAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const readSetOptionsQuery = useReadSetOptionsQuery();
  const loadables = useArray([identifierIssuerOptionsQuery, readSetOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).readSetIdentifiersGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).readSetIdentifiersPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbReadSetIdentifier) => {
    const id = requireId(item.id);
    return (await container.resolve(SeqDbSeqApi).readSetIdentifiersPutOne(
      id,
      { ...variables, id },
    )).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbReadSetIdentifier) => {
    return container.resolve(SeqDbSeqApi).readSetIdentifiersDeleteOne(requireId(item.id));
  }, []);

  const getName = useCallback((item: FormFields | SeqDbReadSetIdentifier) => {
    const issuerName = identifierIssuerOptionsQuery.options.find(option => option.value === item.identifier_issuer_id)?.label ?? item.identifier_issuer_id;
    const readSetName = readSetOptionsQuery.options.find(option => option.value === item.internal_id)?.label ?? item.internal_id;
    return [readSetName, item.external_id, issuerName].filter(Boolean).join(' - ') || ('id' in item && item.id) || '';
  }, [identifierIssuerOptionsQuery.options, readSetOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      external_id: string().required(),
      identifier_issuer_id: string().required(),
      internal_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Read set`,
        loading: readSetOptionsQuery.isLoading,
        name: 'internal_id',
        options: readSetOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Identifier issuer`,
        loading: identifierIssuerOptionsQuery.isLoading,
        name: 'identifier_issuer_id',
        options: identifierIssuerOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`External identifier`,
        name: 'external_id',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [identifierIssuerOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, readSetOptionsQuery.isLoading, readSetOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbReadSetIdentifier>[] => {
    return [
      TableUtil.createOptionsColumn<SeqDbReadSetIdentifier>({ id: 'internal_id', name: t`Read set`, options: readSetOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbReadSetIdentifier>({ id: 'identifier_issuer_id', name: t`Identifier issuer`, options: identifierIssuerOptionsQuery.options }),
      TableUtil.createTextColumn<SeqDbReadSetIdentifier>({ id: 'external_id', name: t`External identifier` }),
    ];
  }, [identifierIssuerOptionsQuery.options, readSetOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbReadSetIdentifier, SeqDbReadSetIdentifier, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new read set identifier`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.ReadSetIdentifierCrudCommand}
      defaultSortByField={'external_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Read set identifier`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.READ_SET_IDENTIFIERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ReadSetIdentifiersAdminPage')}
      title={t`Read set identifiers`}
      updateOne={updateOne}
    />
  );
};
