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
  SeqDbSeqIdentifier,
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

import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbSeqIdentifier, 'identifier_issuer' | 'seq'>;
type SeqDbSeqIdentifierWithId = { id: string } & SeqDbSeqIdentifier;

const isSeqDbSeqIdentifierWithId = (item: SeqDbSeqIdentifier): item is SeqDbSeqIdentifierWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

const requireSeqIdentifierId = (item: SeqDbSeqIdentifier): SeqDbSeqIdentifierWithId => {
  if (!isSeqDbSeqIdentifierWithId(item)) {
    throw new Error('SeqDB returned a sequence identifier without an ID.');
  }
  return item;
};

export const SeqIdentifiersAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const loadables = useArray([identifierIssuerOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).seqIdentifiersGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbSeqIdentifierWithId)) {
      throw new Error('SeqDB returned a sequence identifier without an ID.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).seqIdentifiersPostOne(variables);
    return requireSeqIdentifierId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqIdentifierWithId) => {
    const response = await container.resolve(SeqDbSeqApi).seqIdentifiersPutOne(item.id, {
      ...variables,
      id: item.id,
    });

    return requireSeqIdentifierId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqIdentifierWithId) => {
    return container.resolve(SeqDbSeqApi).seqIdentifiersDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqIdentifierWithId) => {
    const issuerName = identifierIssuerOptionsQuery.options.find(option => option.value === item.identifier_issuer_id)?.label ?? item.identifier_issuer_id;
    /* v8 ignore start -- the 'id' check is false only for form values with an empty external_id, which the required schema rejects before getName runs */
    return item.external_id
      ? `${issuerName}: ${item.external_id}`
      : item.internal_id || ('id' in item && item.id) || issuerName;
    /* v8 ignore stop */
  }, [identifierIssuerOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      external_id: string().required().trim(),
      identifier_issuer_id: string().required(),
      internal_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useCallback((item: SeqDbSeqIdentifierWithId, _values: FormFields) => {
    const identityIsFixed = Boolean(item?.id);

    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: identityIsFixed,
        label: t`Identifier issuer`,
        loading: identifierIssuerOptionsQuery.isLoading,
        name: 'identifier_issuer_id',
        options: identifierIssuerOptionsQuery.options,
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        disabled: identityIsFixed,
        label: t`External identifier`,
        name: 'external_id',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Internal identifier`,
        name: 'internal_id',
        required: true,
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [identifierIssuerOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbSeqIdentifierWithId>[] => [
    TableUtil.createOptionsColumn<SeqDbSeqIdentifierWithId>({
      id: 'identifier_issuer_id',
      name: t`Identifier issuer`,
      options: identifierIssuerOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqIdentifierWithId>({ id: 'external_id', name: t`External identifier` }),
    TableUtil.createTextColumn<SeqDbSeqIdentifierWithId>({ id: 'internal_id', name: t`Internal identifier` }),
  ], [identifierIssuerOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbSeqIdentifierWithId, SeqDbSeqIdentifierWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence identifier`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqIdentifierCrudCommand}
      defaultSortByField={'external_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence identifier`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_IDENTIFIERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqIdentifiersAdminPage')}
      title={t`Sequence identifiers`}
      updateOne={updateOne}
    />
  );
};
