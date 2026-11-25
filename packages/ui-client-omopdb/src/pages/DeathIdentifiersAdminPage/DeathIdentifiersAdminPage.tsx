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
  OmopDbApiPermission,
  OmopDbDeathIdentifier,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbOmopApi,
} from '@gen-epix/api-omopdb';
import type { OmitWithMetaData } from '@gen-epix/ui-client-common/models/data.models';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { CrudPage } from '@gen-epix/ui-client-common/pages/CrudPage';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { useIdentifierIssuerOptionsQuery } from '@gen-epix/ui-client-common/dataHooks/useIdentifierIssuerQuery';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useDeathOptionsQuery } from '../../dataHooks/useDeathQuery';

type FormFields = OmitWithMetaData<OmopDbDeathIdentifier, 'death' | 'identifier_issuer'>;
type Row = { id: string } & OmopDbDeathIdentifier;
const toTableRow = (item: OmopDbDeathIdentifier): Row => {
  return OmopDbAdminUtil.withId(item, 'id', 'Death Identifier');
};
export const DeathIdentifiersAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const deathOptionsQuery = useDeathOptionsQuery();
  const loadables = useArray([identifierIssuerOptionsQuery, deathOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).deathIdentifiersGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).deathIdentifiersDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'id', 'Death Identifier'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'id', 'Death Identifier');
    const response = await container.resolve(OmopDbOmopApi).deathIdentifiersPutOne(id, { ...variables, id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).deathIdentifiersPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const identifierIssuerId = item.identifier_issuer_id;
    if (typeof identifierIssuerId === 'string' && identifierIssuerId.length > 0) {
      const identifierIssuerIdOption = identifierIssuerOptionsQuery.options.find(candidate => candidate.value === identifierIssuerId);
      if (identifierIssuerIdOption?.label) {
        return identifierIssuerIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined here, so the check is always true */
      if (!fallbackValue) {
        fallbackValue = identifierIssuerId;
      }
    }
    const internalId = item.internal_id;
    if (typeof internalId === 'string' && internalId.length > 0) {
      const internalIdOption = deathOptionsQuery.options.find(candidate => candidate.value === internalId);
      if (internalIdOption?.label) {
        return internalIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = internalId;
      }
    }
    const externalId = item.external_id;
    if (typeof externalId === 'string' && externalId.trim().length > 0) {
      return externalId;
    }
    if (typeof externalId === 'number') {
      return String(externalId);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- unreachable: validated create/edit values always set fallbackValue via identifier_issuer_id, and rows always have a non-empty id */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the preceding else ignore */
    return t`New death identifier`;
  }, [identifierIssuerOptionsQuery.options, deathOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      external_id: string().required(),
      identifier_issuer_id: string().required(),
      internal_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Identifier Issuer ID`, loading: identifierIssuerOptionsQuery.isLoading, name: 'identifier_issuer_id', options: identifierIssuerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`External ID`, name: 'external_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Internal ID`, loading: deathOptionsQuery.isLoading, name: 'internal_id', options: deathOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [identifierIssuerOptionsQuery.isLoading, deathOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, deathOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'identifier_issuer_id', name: t`Identifier Issuer ID`, options: identifierIssuerOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'external_id', name: t`External ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'internal_id', name: t`Internal ID`, options: deathOptionsQuery.options }),
    ];
  }, [identifierIssuerOptionsQuery.options, deathOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new death identifier`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DeathIdentifierCrudCommand}
      defaultSortByField={'identifier_issuer_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Death Identifier`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DEATH_IDENTIFIERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DeathIdentifiersAdminPage')}
      title={t`Death Identifiers`}
      updateOne={updateOne}
    />
  );
};
