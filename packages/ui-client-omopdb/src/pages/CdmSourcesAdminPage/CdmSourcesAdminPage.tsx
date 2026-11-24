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
  OmopDbCdmSource,
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

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';

type FormFields = OmitWithMetaData<OmopDbCdmSource, 'cdm_source_id'>;
type Row = { id: string } & OmopDbCdmSource;
const toTableRow = (item: OmopDbCdmSource): Row => {
  return OmopDbAdminUtil.withId(item, 'cdm_source_id', 'CDM Source');
};
export const CdmSourcesAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).cdmSourcesGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).cdmSourcesDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'cdm_source_id', 'CDM Source'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'cdm_source_id', 'CDM Source');
    const response = await container.resolve(OmopDbOmopApi).cdmSourcesPutOne(id, { ...variables, cdm_source_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).cdmSourcesPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const cdmSourceName = item.cdm_source_name;
    if (typeof cdmSourceName === 'string' && cdmSourceName.trim().length > 0) {
      return cdmSourceName;
    }
    if (typeof cdmSourceName === 'number') {
      return String(cdmSourceName);
    }
    const cdmVersionConceptId = item.cdm_version_concept_id;
    if (typeof cdmVersionConceptId === 'string' && cdmVersionConceptId.length > 0) {
      const cdmVersionConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === cdmVersionConceptId);
      if (cdmVersionConceptIdOption?.label) {
        return cdmVersionConceptIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is only assigned in this block, so it is always undefined here */
      if (!fallbackValue) {
        fallbackValue = cdmVersionConceptId;
      }
    }
    const cdmSourceAbbreviation = item.cdm_source_abbreviation;
    if (typeof cdmSourceAbbreviation === 'string' && cdmSourceAbbreviation.trim().length > 0) {
      return cdmSourceAbbreviation;
    }
    if (typeof cdmSourceAbbreviation === 'number') {
      return String(cdmSourceAbbreviation);
    }
    const cdmHolder = item.cdm_holder;
    if (typeof cdmHolder === 'string' && cdmHolder.trim().length > 0) {
      return cdmHolder;
    }
    if (typeof cdmHolder === 'number') {
      return String(cdmHolder);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- only yup-validated create values lack an id, and they always have a non-empty cdm_version_concept_id, so fallbackValue is set */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable: fallbackValue is always set here (see the if above) */
    return t`New cdm source`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      cdm_etl_reference: string().nullable().notRequired(),
      cdm_holder: string().required(),
      cdm_release_date: SchemaUtil.isoString.required(),
      cdm_source_abbreviation: string().required(),
      cdm_source_name: string().required(),
      cdm_version: string().nullable().notRequired(),
      cdm_version_concept_id: string().required(),
      source_description: string().nullable().notRequired(),
      source_documentation_reference: string().nullable().notRequired(),
      source_release_date: SchemaUtil.isoString.required(),
      vocabulary_version: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`CDM Source Name`, name: 'cdm_source_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`CDM Source Abbreviation`, name: 'cdm_source_abbreviation' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`CDM Holder`, name: 'cdm_holder' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Description`, name: 'source_description' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Documentation Reference`, name: 'source_documentation_reference' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`CDM Etl Reference`, name: 'cdm_etl_reference' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Source Release Date`, name: 'source_release_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`CDM Release Date`, name: 'cdm_release_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`CDM Version`, name: 'cdm_version' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`CDM Version Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'cdm_version_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Vocabulary Version`, name: 'vocabulary_version' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'cdm_source_name', name: t`CDM Source Name` }),
      TableUtil.createTextColumn<Row>({ id: 'cdm_source_abbreviation', name: t`CDM Source Abbreviation` }),
      TableUtil.createTextColumn<Row>({ id: 'cdm_holder', name: t`CDM Holder` }),
      TableUtil.createTextColumn<Row>({ id: 'source_description', name: t`Source Description` }),
      TableUtil.createTextColumn<Row>({ id: 'source_documentation_reference', name: t`Source Documentation Reference` }),
      TableUtil.createTextColumn<Row>({ id: 'cdm_etl_reference', name: t`CDM Etl Reference` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'source_release_date', name: t`Source Release Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'cdm_release_date', name: t`CDM Release Date` }),
      TableUtil.createTextColumn<Row>({ id: 'cdm_version', name: t`CDM Version` }),
      TableUtil.createOptionsColumn<Row>({ id: 'cdm_version_concept_id', name: t`CDM Version Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'vocabulary_version', name: t`Vocabulary Version` }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new cdm source`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.CdmSourceCrudCommand}
      defaultSortByField={'cdm_source_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`CDM Source`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CDM_SOURCES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CdmSourcesAdminPage')}
      title={t`CDM Sources`}
      updateOne={updateOne}
    />
  );
};
