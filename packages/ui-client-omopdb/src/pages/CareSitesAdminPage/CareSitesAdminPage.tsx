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
  OmopDbCareSite,
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
import { useSiteOptionsQuery } from '@gen-epix/ui-client-common/dataHooks/useSitesQuery';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { useLocationOptionsQuery } from '../../dataHooks/useLocationQuery';

type FormFields = OmitWithMetaData<OmopDbCareSite, 'care_site_id'>;
type Row = { id: string } & OmopDbCareSite;
const toTableRow = (item: OmopDbCareSite): Row => {
  return OmopDbAdminUtil.withId(item, 'care_site_id', 'Care Site');
};
export const CareSitesAdminPage = () => {
  const { t } = useTranslation();
  const siteOptionsQuery = useSiteOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const locationOptionsQuery = useLocationOptionsQuery();
  const loadables = useArray([siteOptionsQuery, conceptOptionsQuery, locationOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).careSitesGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).careSitesDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'care_site_id', 'Care Site'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'care_site_id', 'Care Site');
    const response = await container.resolve(OmopDbOmopApi).careSitesPutOne(id, { ...variables, care_site_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).careSitesPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const careSiteName = item.care_site_name;
    if (typeof careSiteName === 'string' && careSiteName.trim().length > 0) {
      return careSiteName;
    }
    if (typeof careSiteName === 'number') {
      return String(careSiteName);
    }
    const careSiteSourceValue = item.care_site_source_value;
    if (typeof careSiteSourceValue === 'string' && careSiteSourceValue.trim().length > 0) {
      return careSiteSourceValue;
    }
    if (typeof careSiteSourceValue === 'number') {
      return String(careSiteSourceValue);
    }
    const placeOfServiceSourceValue = item.place_of_service_source_value;
    if (typeof placeOfServiceSourceValue === 'string' && placeOfServiceSourceValue.trim().length > 0) {
      return placeOfServiceSourceValue;
    }
    if (typeof placeOfServiceSourceValue === 'number') {
      return String(placeOfServiceSourceValue);
    }
    const placeOfServiceConceptId = item.place_of_service_concept_id;
    if (typeof placeOfServiceConceptId === 'string' && placeOfServiceConceptId.length > 0) {
      const placeOfServiceConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === placeOfServiceConceptId);
      if (placeOfServiceConceptIdOption?.label) {
        return placeOfServiceConceptIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined here (only assigned in this block), so the else arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = placeOfServiceConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New care site`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      care_site_name: string().nullable().notRequired(),
      care_site_source_value: string().nullable().notRequired(),
      location_id: string().nullable().notRequired(),
      place_of_service_concept_id: string().nullable().notRequired(),
      place_of_service_source_value: string().nullable().notRequired(),
      site_id: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Care Site Name`, name: 'care_site_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Place Of Service Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'place_of_service_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Location ID`, loading: locationOptionsQuery.isLoading, name: 'location_id', options: locationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Care Site Source Value`, name: 'care_site_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Place Of Service Source Value`, name: 'place_of_service_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Site ID`, loading: siteOptionsQuery.isLoading, name: 'site_id', options: siteOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [siteOptionsQuery.isLoading, conceptOptionsQuery.isLoading, locationOptionsQuery.isLoading, siteOptionsQuery.options, conceptOptionsQuery.options, locationOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'care_site_name', name: t`Care Site Name` }),
      TableUtil.createOptionsColumn<Row>({ id: 'place_of_service_concept_id', name: t`Place Of Service Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'location_id', name: t`Location ID`, options: locationOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'care_site_source_value', name: t`Care Site Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'place_of_service_source_value', name: t`Place Of Service Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'site_id', name: t`Site ID`, options: siteOptionsQuery.options }),
    ];
  }, [siteOptionsQuery.options, conceptOptionsQuery.options, locationOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new care site`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.CareSiteCrudCommand}
      defaultSortByField={'care_site_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Care Site`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CARE_SITES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CareSitesAdminPage')}
      title={t`Care Sites`}
      updateOne={updateOne}
    />
  );
};
