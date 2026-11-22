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
  OmopDbSpecimenIdentifier,
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
import { useSpecimenOptionsQuery } from '../../dataHooks/useSpecimenQuery';

type FormFields = OmitWithMetaData<OmopDbSpecimenIdentifier, 'identifier_issuer' | 'specimen'>;
type Row = { id: string } & OmopDbSpecimenIdentifier;
const toTableRow = (item: OmopDbSpecimenIdentifier): Row => {
  return OmopDbAdminUtil.withId(item, 'id', 'Specimen Identifier');
};
export const SpecimenIdentifiersAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const specimenOptionsQuery = useSpecimenOptionsQuery();
  const loadables = useArray([identifierIssuerOptionsQuery, specimenOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).specimenIdentifiersGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).specimenIdentifiersDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'id', 'Specimen Identifier'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'id', 'Specimen Identifier');
    const response = await container.resolve(OmopDbOmopApi).specimenIdentifiersPutOne(id, { ...variables, id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).specimenIdentifiersPostOne(variables);
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
      const internalIdOption = specimenOptionsQuery.options.find(candidate => candidate.value === internalId);
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
    /* v8 ignore else -- create requires a non-empty identifier_issuer_id, which sets fallbackValue; rows return at the id check */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the preceding else ignore */
    return t`New specimen identifier`;
  }, [identifierIssuerOptionsQuery.options, specimenOptionsQuery.options, t]);
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
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Internal ID`, loading: specimenOptionsQuery.isLoading, name: 'internal_id', options: specimenOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [identifierIssuerOptionsQuery.isLoading, specimenOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, specimenOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'identifier_issuer_id', name: t`Identifier Issuer ID`, options: identifierIssuerOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'external_id', name: t`External ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'internal_id', name: t`Internal ID`, options: specimenOptionsQuery.options }),
    ];
  }, [identifierIssuerOptionsQuery.options, specimenOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new specimen identifier`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.SpecimenIdentifierCrudCommand}
      defaultSortByField={'identifier_issuer_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Specimen Identifier`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.SPECIMEN_IDENTIFIERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SpecimenIdentifiersAdminPage')}
      title={t`Specimen Identifiers`}
      updateOne={updateOne}
    />
  );
};
