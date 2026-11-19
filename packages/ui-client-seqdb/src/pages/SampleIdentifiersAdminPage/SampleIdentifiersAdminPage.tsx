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
  SeqDbSampleIdentifier,
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

import { useSampleOptionsQuery } from '../../dataHooks/useSamplesQuery';
import { SEQDB_QUERY_KEY } from '../../constants/query.constants';

type FormFields = OmitWithMetaData<SeqDbSampleIdentifier, 'identifier_issuer'>;

const requireId = (id: SeqDbSampleIdentifier['id']): string => {
  if (!id) {
    throw new Error('Cannot update or delete a sample identifier without an ID.');
  }
  return id;
};

export const SampleIdentifiersAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const sampleOptionsQuery = useSampleOptionsQuery();
  const loadables = useArray([identifierIssuerOptionsQuery, sampleOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await container.resolve(SeqDbSeqApi).sampleIdentifiersGetAll(null, null, { signal })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await container.resolve(SeqDbSeqApi).sampleIdentifiersPostOne(variables)).data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: SeqDbSampleIdentifier) => {
    const id = requireId(item.id);
    return (await container.resolve(SeqDbSeqApi).sampleIdentifiersPutOne(
      id,
      { ...variables, id },
    )).data;
  }, []);

  const deleteOne = useCallback(async (item: SeqDbSampleIdentifier) => {
    return container.resolve(SeqDbSeqApi).sampleIdentifiersDeleteOne(requireId(item.id));
  }, []);

  const getName = useCallback((item: FormFields | SeqDbSampleIdentifier) => {
    const issuerName = identifierIssuerOptionsQuery.options.find(option => option.value === item.identifier_issuer_id)?.label ?? item.identifier_issuer_id;
    const sampleName = sampleOptionsQuery.options.find(option => option.value === item.internal_id)?.label ?? item.internal_id;
    return [sampleName, item.external_id, issuerName].filter(Boolean).join(' - ') || ('id' in item && item.id) || '';
  }, [identifierIssuerOptionsQuery.options, sampleOptionsQuery.options]);

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
        label: t`Sample`,
        loading: sampleOptionsQuery.isLoading,
        name: 'internal_id',
        options: sampleOptionsQuery.options,
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
  }, [identifierIssuerOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, sampleOptionsQuery.isLoading, sampleOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<SeqDbSampleIdentifier>[] => {
    return [
      TableUtil.createOptionsColumn<SeqDbSampleIdentifier>({ id: 'internal_id', name: t`Sample`, options: sampleOptionsQuery.options }),
      TableUtil.createOptionsColumn<SeqDbSampleIdentifier>({ id: 'identifier_issuer_id', name: t`Identifier issuer`, options: identifierIssuerOptionsQuery.options }),
      TableUtil.createTextColumn<SeqDbSampleIdentifier>({ id: 'external_id', name: t`External identifier` }),
    ];
  }, [identifierIssuerOptionsQuery.options, sampleOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, SeqDbSampleIdentifier, SeqDbSampleIdentifier, SEQDB_QUERY_KEY, SeqDbApiPermission>
      createItemDialogTitle={t`Create new sample identifier`}
      createOne={createOne}
      crudCommandType={SeqDbCommandName.SampleIdentifierCrudCommand}
      defaultSortByField={'external_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Sample identifier`}
      loadables={loadables}
      resourceQueryKeyBase={SEQDB_QUERY_KEY.SAMPLE_IDENTIFIERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SampleIdentifiersAdminPage')}
      title={t`Sample identifiers`}
      updateOne={updateOne}
    />
  );
};
