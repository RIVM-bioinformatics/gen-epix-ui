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
  OmopDbPerson,
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
import { useCareSiteOptionsQuery } from '../../dataHooks/useCareSiteQuery';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { useLocationOptionsQuery } from '../../dataHooks/useLocationQuery';
import { useProviderOptionsQuery } from '../../dataHooks/useProviderQuery';

type FormFields = OmitWithMetaData<OmopDbPerson, 'person_id'>;
type Row = { id: string } & OmopDbPerson;
const toTableRow = (item: OmopDbPerson): Row => {
  return OmopDbAdminUtil.withId(item, 'person_id', 'Person');
};
export const PersonsAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const careSiteOptionsQuery = useCareSiteOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const locationOptionsQuery = useLocationOptionsQuery();
  const providerOptionsQuery = useProviderOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, careSiteOptionsQuery, conceptOptionsQuery, locationOptionsQuery, providerOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).personsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).personsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'person_id', 'Person'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'person_id', 'Person');
    const response = await container.resolve(OmopDbOmopApi).personsPutOne(id, { ...variables, person_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).personsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    const personSourceValue = item.person_source_value;
    if (typeof personSourceValue === 'string' && personSourceValue.trim().length > 0) {
      return personSourceValue;
    }
    if (typeof personSourceValue === 'number') {
      return String(personSourceValue);
    }
    const genderSourceValue = item.gender_source_value;
    if (typeof genderSourceValue === 'string' && genderSourceValue.trim().length > 0) {
      return genderSourceValue;
    }
    if (typeof genderSourceValue === 'number') {
      return String(genderSourceValue);
    }
    const raceSourceValue = item.race_source_value;
    if (typeof raceSourceValue === 'string' && raceSourceValue.trim().length > 0) {
      return raceSourceValue;
    }
    if (typeof raceSourceValue === 'number') {
      return String(raceSourceValue);
    }
    const ethnicitySourceValue = item.ethnicity_source_value;
    if (typeof ethnicitySourceValue === 'string' && ethnicitySourceValue.trim().length > 0) {
      return ethnicitySourceValue;
    }
    if (typeof ethnicitySourceValue === 'number') {
      return String(ethnicitySourceValue);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    return t`New person`;
  }, [t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      birth_datetime: SchemaUtil.isoString.nullable().notRequired(),
      care_site_id: string().nullable().notRequired(),
      day_of_birth: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      ethnicity_concept_id: string().required(),
      ethnicity_source_concept_id: string().nullable().notRequired(),
      ethnicity_source_value: string().nullable().notRequired(),
      gender_concept_id: string().required(),
      gender_source_concept_id: string().nullable().notRequired(),
      gender_source_value: string().nullable().notRequired(),
      location_id: string().nullable().notRequired(),
      month_of_birth: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      person_source_value: string().nullable().notRequired(),
      person_type_concept_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      provider_id: string().nullable().notRequired(),
      race_concept_id: string().required(),
      race_source_concept_id: string().nullable().notRequired(),
      race_source_value: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      year_of_birth: SchemaUtil.number.required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Gender Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'gender_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Year Of Birth`, name: 'year_of_birth', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Month Of Birth`, name: 'month_of_birth', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Day Of Birth`, name: 'day_of_birth', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Birth Datetime`, name: 'birth_datetime' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Race Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'race_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Ethnicity Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'ethnicity_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Location ID`, loading: locationOptionsQuery.isLoading, name: 'location_id', options: locationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provider ID`, loading: providerOptionsQuery.isLoading, name: 'provider_id', options: providerOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Care Site ID`, loading: careSiteOptionsQuery.isLoading, name: 'care_site_id', options: careSiteOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Person Source Value`, name: 'person_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Gender Source Value`, name: 'gender_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Gender Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'gender_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Race Source Value`, name: 'race_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Race Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'race_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Ethnicity Source Value`, name: 'ethnicity_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Ethnicity Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'ethnicity_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'person_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, careSiteOptionsQuery.isLoading, conceptOptionsQuery.isLoading, locationOptionsQuery.isLoading, providerOptionsQuery.isLoading, organizationOptionsQuery.options, careSiteOptionsQuery.options, conceptOptionsQuery.options, locationOptionsQuery.options, providerOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'gender_concept_id', name: t`Gender Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'year_of_birth', name: t`Year Of Birth` }),
      TableUtil.createNumberColumn<Row>({ id: 'month_of_birth', name: t`Month Of Birth` }),
      TableUtil.createNumberColumn<Row>({ id: 'day_of_birth', name: t`Day Of Birth` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'birth_datetime', name: t`Birth Datetime` }),
      TableUtil.createOptionsColumn<Row>({ id: 'race_concept_id', name: t`Race Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'ethnicity_concept_id', name: t`Ethnicity Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'location_id', name: t`Location ID`, options: locationOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provider_id', name: t`Provider ID`, options: providerOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'care_site_id', name: t`Care Site ID`, options: careSiteOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'person_source_value', name: t`Person Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'gender_source_value', name: t`Gender Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'gender_source_concept_id', name: t`Gender Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'race_source_value', name: t`Race Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'race_source_concept_id', name: t`Race Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'ethnicity_source_value', name: t`Ethnicity Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'ethnicity_source_concept_id', name: t`Ethnicity Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_type_concept_id', name: t`Person Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, careSiteOptionsQuery.options, conceptOptionsQuery.options, locationOptionsQuery.options, providerOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new person`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.PersonCrudCommand}
      defaultSortByField={'person_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Person`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.PERSONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('PersonsAdminPage')}
      title={t`Persons`}
      updateOne={updateOne}
    />
  );
};
