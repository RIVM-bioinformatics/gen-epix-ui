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
  OmopDbSpecimen,
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
import { useSpecimenOptionsQuery } from '../../dataHooks/useSpecimenQuery';

type FormFields = OmitWithMetaData<OmopDbSpecimen, 'specimen_id'>;
type Row = { id: string } & OmopDbSpecimen;
const toTableRow = (item: OmopDbSpecimen): Row => {
  return OmopDbAdminUtil.withId(item, 'specimen_id', 'Specimen');
};
export const SpecimensAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const specimenOptionsQuery = useSpecimenOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery, specimenOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).specimensGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).specimensDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'specimen_id', 'Specimen'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'specimen_id', 'Specimen');
    const response = await container.resolve(OmopDbOmopApi).specimensPutOne(id, { ...variables, specimen_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).specimensPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    const specimenSourceValue = item.specimen_source_value;
    if (typeof specimenSourceValue === 'string' && specimenSourceValue.trim().length > 0) {
      return specimenSourceValue;
    }
    if (typeof specimenSourceValue === 'number') {
      return String(specimenSourceValue);
    }
    const unitSourceValue = item.unit_source_value;
    if (typeof unitSourceValue === 'string' && unitSourceValue.trim().length > 0) {
      return unitSourceValue;
    }
    if (typeof unitSourceValue === 'number') {
      return String(unitSourceValue);
    }
    const anatomicSiteSourceValue = item.anatomic_site_source_value;
    if (typeof anatomicSiteSourceValue === 'string' && anatomicSiteSourceValue.trim().length > 0) {
      return anatomicSiteSourceValue;
    }
    if (typeof anatomicSiteSourceValue === 'number') {
      return String(anatomicSiteSourceValue);
    }
    const diseaseStatusSourceValue = item.disease_status_source_value;
    if (typeof diseaseStatusSourceValue === 'string' && diseaseStatusSourceValue.trim().length > 0) {
      return diseaseStatusSourceValue;
    }
    if (typeof diseaseStatusSourceValue === 'number') {
      return String(diseaseStatusSourceValue);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    return t`New specimen`;
  }, [t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      anatomic_site_concept_id: string().nullable().notRequired(),
      anatomic_site_source_value: string().nullable().notRequired(),
      derived_from_specimen_concept_id: string().nullable().notRequired(),
      derived_from_specimen_id: string().nullable().notRequired(),
      disease_status_concept_id: string().nullable().notRequired(),
      disease_status_source_value: string().nullable().notRequired(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      quantity: number().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      specimen_concept_id: string().required(),
      specimen_date: string().required(),
      specimen_datetime: string().nullable().notRequired(),
      specimen_iso_interval: string().nullable().notRequired(),
      specimen_source_id: string().nullable().notRequired(),
      specimen_source_value: string().nullable().notRequired(),
      specimen_type_concept_id: string().required(),
      unit_concept_id: string().nullable().notRequired(),
      unit_source_value: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Specimen Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'specimen_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Specimen Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'specimen_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Specimen Date`, name: 'specimen_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Specimen Datetime`, name: 'specimen_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Quantity`, name: 'quantity' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Unit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'unit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Anatomic Site Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'anatomic_site_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Disease Status Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'disease_status_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Specimen Source ID`, name: 'specimen_source_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Specimen Source Value`, name: 'specimen_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Unit Source Value`, name: 'unit_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Anatomic Site Source Value`, name: 'anatomic_site_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Disease Status Source Value`, name: 'disease_status_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Specimen ISO Interval`, name: 'specimen_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Derived From Specimen ID`, loading: specimenOptionsQuery.isLoading, name: 'derived_from_specimen_id', options: specimenOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Derived From Specimen Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'derived_from_specimen_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, specimenOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, specimenOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'specimen_concept_id', name: t`Specimen Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'specimen_type_concept_id', name: t`Specimen Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'specimen_date', name: t`Specimen Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'specimen_datetime', name: t`Specimen Datetime` }),
      TableUtil.createNumberColumn<Row>({ id: 'quantity', name: t`Quantity` }),
      TableUtil.createOptionsColumn<Row>({ id: 'unit_concept_id', name: t`Unit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'anatomic_site_concept_id', name: t`Anatomic Site Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'disease_status_concept_id', name: t`Disease Status Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'specimen_source_id', name: t`Specimen Source ID` }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'specimen_source_value', name: t`Specimen Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'unit_source_value', name: t`Unit Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'anatomic_site_source_value', name: t`Anatomic Site Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'disease_status_source_value', name: t`Disease Status Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'specimen_iso_interval', name: t`Specimen ISO Interval` }),
      TableUtil.createOptionsColumn<Row>({ id: 'derived_from_specimen_id', name: t`Derived From Specimen ID`, options: specimenOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'derived_from_specimen_concept_id', name: t`Derived From Specimen Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, specimenOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new specimen`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.SpecimenCrudCommand}
      defaultSortByField={'specimen_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Specimen`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.SPECIMENS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SpecimensAdminPage')}
      title={t`Specimens`}
      updateOne={updateOne}
    />
  );
};
