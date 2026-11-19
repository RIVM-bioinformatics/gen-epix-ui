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
  OmopDbProvider,
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
import { useCareSiteOptionsQuery } from '../../dataHooks/useCareSiteQuery';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';

type FormFields = OmitWithMetaData<OmopDbProvider, 'provider_id'>;
type Row = { id: string } & OmopDbProvider;
const toTableRow = (item: OmopDbProvider): Row => {
  return OmopDbAdminUtil.withId(item, 'provider_id', 'Provider');
};
export const ProvidersAdminPage = () => {
  const { t } = useTranslation();
  const careSiteOptionsQuery = useCareSiteOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([careSiteOptionsQuery, conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).providersGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).providersDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'provider_id', 'Provider'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'provider_id', 'Provider');
    const response = await container.resolve(OmopDbOmopApi).providersPutOne(id, { ...variables, provider_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).providersPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    const providerName = item.provider_name;
    if (typeof providerName === 'string' && providerName.trim().length > 0) {
      return providerName;
    }
    if (typeof providerName === 'number') {
      return String(providerName);
    }
    const providerSourceValue = item.provider_source_value;
    if (typeof providerSourceValue === 'string' && providerSourceValue.trim().length > 0) {
      return providerSourceValue;
    }
    if (typeof providerSourceValue === 'number') {
      return String(providerSourceValue);
    }
    const specialtySourceValue = item.specialty_source_value;
    if (typeof specialtySourceValue === 'string' && specialtySourceValue.trim().length > 0) {
      return specialtySourceValue;
    }
    if (typeof specialtySourceValue === 'number') {
      return String(specialtySourceValue);
    }
    const genderSourceValue = item.gender_source_value;
    if (typeof genderSourceValue === 'string' && genderSourceValue.trim().length > 0) {
      return genderSourceValue;
    }
    if (typeof genderSourceValue === 'number') {
      return String(genderSourceValue);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    return t`New provider`;
  }, [t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      care_site_id: string().nullable().notRequired(),
      dea: string().nullable().notRequired(),
      gender_concept_id: string().nullable().notRequired(),
      gender_source_concept_id: string().nullable().notRequired(),
      gender_source_value: string().nullable().notRequired(),
      npi: string().nullable().notRequired(),
      provider_name: string().nullable().notRequired(),
      provider_source_value: string().nullable().notRequired(),
      specialty_concept_id: string().nullable().notRequired(),
      specialty_source_concept_id: string().nullable().notRequired(),
      specialty_source_value: string().nullable().notRequired(),
      year_of_birth: number().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provider Name`, name: 'provider_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Npi`, name: 'npi' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Dea`, name: 'dea' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Specialty Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'specialty_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Care Site ID`, loading: careSiteOptionsQuery.isLoading, name: 'care_site_id', options: careSiteOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Year Of Birth`, name: 'year_of_birth' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Gender Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'gender_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provider Source Value`, name: 'provider_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Specialty Source Value`, name: 'specialty_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Specialty Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'specialty_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Gender Source Value`, name: 'gender_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Gender Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'gender_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [careSiteOptionsQuery.isLoading, conceptOptionsQuery.isLoading, careSiteOptionsQuery.options, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'provider_name', name: t`Provider Name` }),
      TableUtil.createTextColumn<Row>({ id: 'npi', name: t`Npi` }),
      TableUtil.createTextColumn<Row>({ id: 'dea', name: t`Dea` }),
      TableUtil.createOptionsColumn<Row>({ id: 'specialty_concept_id', name: t`Specialty Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'care_site_id', name: t`Care Site ID`, options: careSiteOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'year_of_birth', name: t`Year Of Birth` }),
      TableUtil.createOptionsColumn<Row>({ id: 'gender_concept_id', name: t`Gender Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'provider_source_value', name: t`Provider Source Value` }),
      TableUtil.createTextColumn<Row>({ id: 'specialty_source_value', name: t`Specialty Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'specialty_source_concept_id', name: t`Specialty Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'gender_source_value', name: t`Gender Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'gender_source_concept_id', name: t`Gender Source Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [careSiteOptionsQuery.options, conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new provider`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ProviderCrudCommand}
      defaultSortByField={'provider_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Provider`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.PROVIDERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ProvidersAdminPage')}
      title={t`Providers`}
      updateOne={updateOne}
    />
  );
};
