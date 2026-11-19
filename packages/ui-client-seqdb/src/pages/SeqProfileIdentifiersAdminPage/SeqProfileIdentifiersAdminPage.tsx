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
  SeqDbSeqProfileIdentifier,
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

type FormFields = OmitWithMetaData<SeqDbSeqProfileIdentifier, 'identifier_issuer' | 'seq_profile'>;
type SeqDbSeqProfileIdentifierWithId = { id: string } & SeqDbSeqProfileIdentifier;

const isSeqDbSeqProfileIdentifierWithId = (item: SeqDbSeqProfileIdentifier): item is SeqDbSeqProfileIdentifierWithId => {
  return typeof item.id === 'string' && item.id.length > 0;
};

const requireSeqProfileIdentifierId = (item: SeqDbSeqProfileIdentifier): SeqDbSeqProfileIdentifierWithId => {
  if (!isSeqDbSeqProfileIdentifierWithId(item)) {
    throw new Error('SeqDB returned a sequence profile identifier without an ID.');
  }
  return item;
};

export const SeqProfileIdentifiersAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const loadables = useArray([identifierIssuerOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(SeqDbSeqApi).seqProfileIdentifiersGetAll(null, null, { signal });
    if (!response.data.every(isSeqDbSeqProfileIdentifierWithId)) {
      throw new Error('SeqDB returned a sequence profile identifier without an ID.');
    }

    return response.data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(SeqDbSeqApi).seqProfileIdentifiersPostOne(variables);
    return requireSeqProfileIdentifierId(response.data);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSeqProfileIdentifierWithId) => {
    const response = await container.resolve(SeqDbSeqApi).seqProfileIdentifiersPutOne(item.id, {
      ...variables,
      id: item.id,
    });

    return requireSeqProfileIdentifierId(response.data);
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSeqProfileIdentifierWithId) => {
    return container.resolve(SeqDbSeqApi).seqProfileIdentifiersDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSeqProfileIdentifierWithId) => {
    const issuerName = identifierIssuerOptionsQuery.options.find(option => option.value === item.identifier_issuer_id)?.label ?? item.identifier_issuer_id;
    return item.external_id
      ? `${issuerName}: ${item.external_id}`
      : item.internal_id || ('id' in item && item.id) || issuerName;
  }, [identifierIssuerOptionsQuery.options]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      external_id: string().required().trim(),
      identifier_issuer_id: string().required(),
      internal_id: string().required(),
    });
  }, []);

  const formFieldDefinitions = useCallback((_values: FormFields, item: SeqDbSeqProfileIdentifierWithId) => {
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

  const tableColumns = useMemo((): TableColumn<SeqDbSeqProfileIdentifierWithId>[] => [
    TableUtil.createOptionsColumn<SeqDbSeqProfileIdentifierWithId>({
      id: 'identifier_issuer_id',
      name: t`Identifier issuer`,
      options: identifierIssuerOptionsQuery.options,
    }),
    TableUtil.createTextColumn<SeqDbSeqProfileIdentifierWithId>({ id: 'external_id', name: t`External identifier` }),
    TableUtil.createTextColumn<SeqDbSeqProfileIdentifierWithId>({ id: 'internal_id', name: t`Internal identifier` }),
  ], [identifierIssuerOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbSeqProfileIdentifierWithId, SeqDbSeqProfileIdentifierWithId, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sequence profile identifier`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SeqProfileIdentifierCrudCommand}
      defaultSortByField={'external_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sequence profile identifier`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SEQ_PROFILE_IDENTIFIERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SeqProfileIdentifiersAdminPage')}
      title={t`Sequence profile identifiers`}
      updateOne={updateOne}
    />
  );
};
