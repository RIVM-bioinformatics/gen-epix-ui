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
  OmopDbDeviceExposureIdentifier,
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
import { useDeviceExposureOptionsQuery } from '../../dataHooks/useDeviceExposureQuery';

type FormFields = OmitWithMetaData<OmopDbDeviceExposureIdentifier, 'device_exposure' | 'identifier_issuer'>;
type Row = { id: string } & OmopDbDeviceExposureIdentifier;
const toTableRow = (item: OmopDbDeviceExposureIdentifier): Row => {
  return OmopDbAdminUtil.withId(item, 'id', 'Device Exposure Identifier');
};
export const DeviceExposureIdentifiersAdminPage = () => {
  const { t } = useTranslation();
  const identifierIssuerOptionsQuery = useIdentifierIssuerOptionsQuery();
  const deviceExposureOptionsQuery = useDeviceExposureOptionsQuery();
  const loadables = useArray([identifierIssuerOptionsQuery, deviceExposureOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).deviceExposureIdentifiersGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).deviceExposureIdentifiersDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'id', 'Device Exposure Identifier'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'id', 'Device Exposure Identifier');
    const response = await container.resolve(OmopDbOmopApi).deviceExposureIdentifiersPutOne(id, { ...variables, id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).deviceExposureIdentifiersPostOne(variables);
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
      if (!fallbackValue) {
        fallbackValue = identifierIssuerId;
      }
    }
    const internalId = item.internal_id;
    if (typeof internalId === 'string' && internalId.length > 0) {
      const internalIdOption = deviceExposureOptionsQuery.options.find(candidate => candidate.value === internalId);
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
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New device exposure identifier`;
  }, [identifierIssuerOptionsQuery.options, deviceExposureOptionsQuery.options, t]);
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
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Internal ID`, loading: deviceExposureOptionsQuery.isLoading, name: 'internal_id', options: deviceExposureOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [identifierIssuerOptionsQuery.isLoading, deviceExposureOptionsQuery.isLoading, identifierIssuerOptionsQuery.options, deviceExposureOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'identifier_issuer_id', name: t`Identifier Issuer ID`, options: identifierIssuerOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'external_id', name: t`External ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'internal_id', name: t`Internal ID`, options: deviceExposureOptionsQuery.options }),
    ];
  }, [identifierIssuerOptionsQuery.options, deviceExposureOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new device exposure identifier`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DeviceExposureIdentifierCrudCommand}
      defaultSortByField={'identifier_issuer_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Device Exposure Identifier`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DEVICE_EXPOSURE_IDENTIFIERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DeviceExposureIdentifiersAdminPage')}
      title={t`Device Exposure Identifiers`}
      updateOne={updateOne}
    />
  );
};
