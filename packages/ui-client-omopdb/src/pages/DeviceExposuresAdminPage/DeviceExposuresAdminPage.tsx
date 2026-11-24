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
import { SchemaUtil } from '@gen-epix/ui-core-form/utils/SchemaUtil';
import type {
  OmopDbApiPermission,
  OmopDbDeviceExposure,
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
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';
import { useOrganizationOptionsQuery } from '@gen-epix/ui-client-common/dataHooks/useOrganizationsQuery';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { usePersonOptionsQuery } from '../../dataHooks/usePersonQuery';
import { useProviderOptionsQuery } from '../../dataHooks/useProviderQuery';
import { useVisitDetailOptionsQuery } from '../../dataHooks/useVisitDetailQuery';
import { useVisitOccurrenceOptionsQuery } from '../../dataHooks/useVisitOccurrenceQuery';

type FormFields = OmitWithMetaData<OmopDbDeviceExposure, 'device_exposure_id'>;
type Row = { id: string } & OmopDbDeviceExposure;
const toTableRow = (item: OmopDbDeviceExposure): Row => {
  return OmopDbAdminUtil.withId(item, 'device_exposure_id', 'Device Exposure');
};
export const DeviceExposuresAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const providerOptionsQuery = useProviderOptionsQuery();
  const visitDetailOptionsQuery = useVisitDetailOptionsQuery();
  const visitOccurrenceOptionsQuery = useVisitOccurrenceOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery, providerOptionsQuery, visitDetailOptionsQuery, visitOccurrenceOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).deviceExposuresGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).deviceExposuresDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'device_exposure_id', 'Device Exposure'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'device_exposure_id', 'Device Exposure');
    const response = await container.resolve(OmopDbOmopApi).deviceExposuresPutOne(id, { ...variables, device_exposure_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).deviceExposuresPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const deviceSourceValue = item.device_source_value;
    if (typeof deviceSourceValue === 'string' && deviceSourceValue.trim().length > 0) {
      return deviceSourceValue;
    }
    if (typeof deviceSourceValue === 'number') {
      return String(deviceSourceValue);
    }
    const unitSourceValue = item.unit_source_value;
    if (typeof unitSourceValue === 'string' && unitSourceValue.trim().length > 0) {
      return unitSourceValue;
    }
    if (typeof unitSourceValue === 'number') {
      return String(unitSourceValue);
    }
    const personId = item.person_id;
    if (typeof personId === 'string' && personId.length > 0) {
      const personIdOption = personOptionsQuery.options.find(candidate => candidate.value === personId);
      if (personIdOption?.label) {
        return personIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is still undefined at this first assignment, so the check is always true */
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    const deviceConceptId = item.device_concept_id;
    if (typeof deviceConceptId === 'string' && deviceConceptId.length > 0) {
      const deviceConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === deviceConceptId);
      if (deviceConceptIdOption?.label) {
        return deviceConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = deviceConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- person_id and device_concept_id are yup-required (non-empty) in create and rows always have an id, so fallbackValue is always set here */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the else skip above */
    return t`New device exposure`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      device_concept_id: string().required(),
      device_exposure_end_date: SchemaUtil.isoString.nullable().notRequired(),
      device_exposure_end_datetime: SchemaUtil.isoString.nullable().notRequired(),
      device_exposure_end_iso_interval: string().nullable().notRequired(),
      device_exposure_start_date: SchemaUtil.isoString.required(),
      device_exposure_start_datetime: SchemaUtil.isoString.nullable().notRequired(),
      device_exposure_start_iso_interval: string().nullable().notRequired(),
      device_source_concept_id: string().nullable().notRequired(),
      device_source_value: string().nullable().notRequired(),
      device_type_concept_id: string().required(),
      person_id: string().required(),
      production_id: string().nullable().notRequired(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      provider_id: string().nullable().notRequired(),
      quantity: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      source_traceback: string().nullable().notRequired(),
      unique_device_id: string().nullable().notRequired(),
      unit_concept_id: string().nullable().notRequired(),
      unit_source_concept_id: string().nullable().notRequired(),
      unit_source_value: string().nullable().notRequired(),
      visit_detail_id: string().nullable().notRequired(),
      visit_occurrence_id: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Device Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'device_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Device Exposure Start Date`, name: 'device_exposure_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Device Exposure Start Datetime`, name: 'device_exposure_start_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Device Exposure End Date`, name: 'device_exposure_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Device Exposure End Datetime`, name: 'device_exposure_end_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Device Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'device_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Unique Device ID`, name: 'unique_device_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Production ID`, name: 'production_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Quantity`, name: 'quantity', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provider ID`, loading: providerOptionsQuery.isLoading, name: 'provider_id', options: providerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Occurrence ID`, loading: visitOccurrenceOptionsQuery.isLoading, name: 'visit_occurrence_id', options: visitOccurrenceOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Detail ID`, loading: visitDetailOptionsQuery.isLoading, name: 'visit_detail_id', options: visitDetailOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Device Source Value`, name: 'device_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Device Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'device_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Unit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'unit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Unit Source Value`, name: 'unit_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Unit Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'unit_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Device Exposure Start ISO Interval`, name: 'device_exposure_start_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Device Exposure End ISO Interval`, name: 'device_exposure_end_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, providerOptionsQuery.isLoading, visitDetailOptionsQuery.isLoading, visitOccurrenceOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'device_concept_id', name: t`Device Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'device_exposure_start_date', name: t`Device Exposure Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'device_exposure_start_datetime', name: t`Device Exposure Start Datetime` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'device_exposure_end_date', name: t`Device Exposure End Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'device_exposure_end_datetime', name: t`Device Exposure End Datetime` }),
      TableUtil.createOptionsColumn<Row>({ id: 'device_type_concept_id', name: t`Device Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'unique_device_id', name: t`Unique Device ID` }),
      TableUtil.createTextColumn<Row>({ id: 'production_id', name: t`Production ID` }),
      TableUtil.createNumberColumn<Row>({ id: 'quantity', name: t`Quantity` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provider_id', name: t`Provider ID`, options: providerOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_occurrence_id', name: t`Visit Occurrence ID`, options: visitOccurrenceOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_detail_id', name: t`Visit Detail ID`, options: visitDetailOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'device_source_value', name: t`Device Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'device_source_concept_id', name: t`Device Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'unit_concept_id', name: t`Unit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'unit_source_value', name: t`Unit Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'unit_source_concept_id', name: t`Unit Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'device_exposure_start_iso_interval', name: t`Device Exposure Start ISO Interval` }),
      TableUtil.createTextColumn<Row>({ id: 'device_exposure_end_iso_interval', name: t`Device Exposure End ISO Interval` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new device exposure`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DeviceExposureCrudCommand}
      defaultSortByField={'device_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Device Exposure`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DEVICE_EXPOSURES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DeviceExposuresAdminPage')}
      title={t`Device Exposures`}
      updateOne={updateOne}
    />
  );
};
