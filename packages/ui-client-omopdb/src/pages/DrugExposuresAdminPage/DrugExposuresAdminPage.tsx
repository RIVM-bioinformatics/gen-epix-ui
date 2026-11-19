import { container } from 'tsyringe';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  number,
  object,
  string,
} from 'yup';
import type {
  OmopDbApiPermission,
  OmopDbDrugExposure,
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

type FormFields = OmitWithMetaData<OmopDbDrugExposure, 'drug_exposure_id'>;
type Row = { id: string } & OmopDbDrugExposure;
const toTableRow = (item: OmopDbDrugExposure): Row => {
  return OmopDbAdminUtil.withId(item, 'drug_exposure_id', 'Drug Exposure');
};
export const DrugExposuresAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const providerOptionsQuery = useProviderOptionsQuery();
  const visitDetailOptionsQuery = useVisitDetailOptionsQuery();
  const visitOccurrenceOptionsQuery = useVisitOccurrenceOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery, providerOptionsQuery, visitDetailOptionsQuery, visitOccurrenceOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).drugExposuresGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).drugExposuresDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'drug_exposure_id', 'Drug Exposure'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'drug_exposure_id', 'Drug Exposure');
    const response = await container.resolve(OmopDbOmopApi).drugExposuresPutOne(id, { ...variables, drug_exposure_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).drugExposuresPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const drugSourceValue = item.drug_source_value;
    if (typeof drugSourceValue === 'string' && drugSourceValue.trim().length > 0) {
      return drugSourceValue;
    }
    if (typeof drugSourceValue === 'number') {
      return String(drugSourceValue);
    }
    const routeSourceValue = item.route_source_value;
    if (typeof routeSourceValue === 'string' && routeSourceValue.trim().length > 0) {
      return routeSourceValue;
    }
    if (typeof routeSourceValue === 'number') {
      return String(routeSourceValue);
    }
    const doseUnitSourceValue = item.dose_unit_source_value;
    if (typeof doseUnitSourceValue === 'string' && doseUnitSourceValue.trim().length > 0) {
      return doseUnitSourceValue;
    }
    if (typeof doseUnitSourceValue === 'number') {
      return String(doseUnitSourceValue);
    }
    const personId = item.person_id;
    if (typeof personId === 'string' && personId.length > 0) {
      const personIdOption = personOptionsQuery.options.find(candidate => candidate.value === personId);
      if (personIdOption?.label) {
        return personIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New drug exposure`;
  }, [personOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      days_supply: number().nullable().notRequired(),
      dose_unit_source_value: string().nullable().notRequired(),
      drug_concept_id: string().required(),
      drug_exposure_end_date: string().required(),
      drug_exposure_end_datetime: string().nullable().notRequired(),
      drug_exposure_end_iso_interval: string().nullable().notRequired(),
      drug_exposure_start_date: string().required(),
      drug_exposure_start_datetime: string().nullable().notRequired(),
      drug_exposure_start_iso_interval: string().nullable().notRequired(),
      drug_source_concept_id: string().nullable().notRequired(),
      drug_source_value: string().nullable().notRequired(),
      drug_type_concept_id: string().required(),
      lot_number: string().nullable().notRequired(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      provider_id: string().nullable().notRequired(),
      quantity: number().nullable().notRequired(),
      refills: number().nullable().notRequired(),
      route_concept_id: string().nullable().notRequired(),
      route_source_value: string().nullable().notRequired(),
      sig: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      stop_reason: string().nullable().notRequired(),
      verbatim_end_date: string().nullable().notRequired(),
      visit_detail_id: string().nullable().notRequired(),
      visit_occurrence_id: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Drug Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'drug_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Drug Exposure Start Date`, name: 'drug_exposure_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Drug Exposure Start Datetime`, name: 'drug_exposure_start_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Drug Exposure End Date`, name: 'drug_exposure_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Drug Exposure End Datetime`, name: 'drug_exposure_end_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Verbatim End Date`, name: 'verbatim_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Drug Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'drug_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Stop Reason`, name: 'stop_reason' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Refills`, name: 'refills' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Quantity`, name: 'quantity' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Days Supply`, name: 'days_supply' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Sig`, name: 'sig' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Route Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'route_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Lot Number`, name: 'lot_number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provider ID`, loading: providerOptionsQuery.isLoading, name: 'provider_id', options: providerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Occurrence ID`, loading: visitOccurrenceOptionsQuery.isLoading, name: 'visit_occurrence_id', options: visitOccurrenceOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Visit Detail ID`, loading: visitDetailOptionsQuery.isLoading, name: 'visit_detail_id', options: visitDetailOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Drug Source Value`, name: 'drug_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Drug Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'drug_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Route Source Value`, name: 'route_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Dose Unit Source Value`, name: 'dose_unit_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Drug Exposure Start ISO Interval`, name: 'drug_exposure_start_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Drug Exposure End ISO Interval`, name: 'drug_exposure_end_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, providerOptionsQuery.isLoading, visitDetailOptionsQuery.isLoading, visitOccurrenceOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'drug_concept_id', name: t`Drug Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'drug_exposure_start_date', name: t`Drug Exposure Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'drug_exposure_start_datetime', name: t`Drug Exposure Start Datetime` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'drug_exposure_end_date', name: t`Drug Exposure End Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'drug_exposure_end_datetime', name: t`Drug Exposure End Datetime` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'verbatim_end_date', name: t`Verbatim End Date` }),
      TableUtil.createOptionsColumn<Row>({ id: 'drug_type_concept_id', name: t`Drug Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'stop_reason', name: t`Stop Reason` }),
      TableUtil.createNumberColumn<Row>({ id: 'refills', name: t`Refills` }),
      TableUtil.createNumberColumn<Row>({ id: 'quantity', name: t`Quantity` }),
      TableUtil.createNumberColumn<Row>({ id: 'days_supply', name: t`Days Supply` }),
      TableUtil.createTextColumn<Row>({ id: 'sig', name: t`Sig` }),
      TableUtil.createOptionsColumn<Row>({ id: 'route_concept_id', name: t`Route Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'lot_number', name: t`Lot Number` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provider_id', name: t`Provider ID`, options: providerOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_occurrence_id', name: t`Visit Occurrence ID`, options: visitOccurrenceOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'visit_detail_id', name: t`Visit Detail ID`, options: visitDetailOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'drug_source_value', name: t`Drug Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'drug_source_concept_id', name: t`Drug Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'route_source_value', name: t`Route Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'dose_unit_source_value', name: t`Dose Unit Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'drug_exposure_start_iso_interval', name: t`Drug Exposure Start ISO Interval` }),
      TableUtil.createTextColumn<Row>({ id: 'drug_exposure_end_iso_interval', name: t`Drug Exposure End ISO Interval` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, providerOptionsQuery.options, visitDetailOptionsQuery.options, visitOccurrenceOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new drug exposure`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DrugExposureCrudCommand}
      defaultSortByField={'drug_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Drug Exposure`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DRUG_EXPOSURES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DrugExposuresAdminPage')}
      title={t`Drug Exposures`}
      updateOne={updateOne}
    />
  );
};
