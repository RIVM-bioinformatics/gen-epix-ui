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
  OmopDbLocation,
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

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';

type FormFields = OmitWithMetaData<OmopDbLocation, 'location_id'>;
type Row = { id: string } & OmopDbLocation;
const toTableRow = (item: OmopDbLocation): Row => {
  return OmopDbAdminUtil.withId(item, 'location_id', 'Location');
};
export const LocationsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).locationsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).locationsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'location_id', 'Location'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'location_id', 'Location');
    const response = await container.resolve(OmopDbOmopApi).locationsPutOne(id, { ...variables, location_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).locationsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const locationSourceValue = item.location_source_value;
    if (typeof locationSourceValue === 'string' && locationSourceValue.trim().length > 0) {
      return locationSourceValue;
    }
    if (typeof locationSourceValue === 'number') {
      return String(locationSourceValue);
    }
    const countrySourceValue = item.country_source_value;
    if (typeof countrySourceValue === 'string' && countrySourceValue.trim().length > 0) {
      return countrySourceValue;
    }
    if (typeof countrySourceValue === 'number') {
      return String(countrySourceValue);
    }
    const countryConceptId = item.country_concept_id;
    if (typeof countryConceptId === 'string' && countryConceptId.length > 0) {
      const countryConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === countryConceptId);
      if (countryConceptIdOption?.label) {
        return countryConceptIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined here (only assigned in this block), so the else arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = countryConceptId;
      }
    }
    const address1 = item.address_1;
    if (typeof address1 === 'string' && address1.trim().length > 0) {
      return address1;
    }
    if (typeof address1 === 'number') {
      return String(address1);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New location`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      address_1: string().nullable().notRequired(),
      address_2: string().nullable().notRequired(),
      city: string().nullable().notRequired(),
      country_concept_id: string().nullable().notRequired(),
      country_source_value: string().nullable().notRequired(),
      county: string().nullable().notRequired(),
      latitude: number().nullable().notRequired(),
      location_source_value: string().nullable().notRequired(),
      longitude: number().nullable().notRequired(),
      state: string().nullable().notRequired(),
      zip: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Address 1`, name: 'address_1' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Address 2`, name: 'address_2' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`City`, name: 'city' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`State`, name: 'state' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Zip`, name: 'zip' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`County`, name: 'county' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Location Source Value`, name: 'location_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Country Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'country_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Country Source Value`, name: 'country_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Latitude`, name: 'latitude' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Longitude`, name: 'longitude' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'address_1', name: t`Address 1` }),
      TableUtil.createTextColumn<Row>({ id: 'address_2', name: t`Address 2` }),
      TableUtil.createTextColumn<Row>({ id: 'city', name: t`City` }),
      TableUtil.createTextColumn<Row>({ id: 'state', name: t`State` }),
      TableUtil.createTextColumn<Row>({ id: 'zip', name: t`Zip` }),
      TableUtil.createTextColumn<Row>({ id: 'county', name: t`County` }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'location_source_value', name: t`Location Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'country_concept_id', name: t`Country Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'country_source_value', name: t`Country Source Value` }),
      TableUtil.createNumberColumn<Row>({ id: 'latitude', name: t`Latitude` }),
      TableUtil.createNumberColumn<Row>({ id: 'longitude', name: t`Longitude` }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new location`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.LocationCrudCommand}
      defaultSortByField={'location_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Location`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.LOCATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('LocationsAdminPage')}
      title={t`Locations`}
      updateOne={updateOne}
    />
  );
};
