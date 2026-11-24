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
  OmopDbCohortDefinition,
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

type FormFields = OmitWithMetaData<OmopDbCohortDefinition, 'cohort_definition_id'>;
type Row = { id: string } & OmopDbCohortDefinition;
const toTableRow = (item: OmopDbCohortDefinition): Row => {
  return OmopDbAdminUtil.withId(item, 'cohort_definition_id', 'Cohort Definition');
};
export const CohortDefinitionsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).cohortDefinitionsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).cohortDefinitionsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'cohort_definition_id', 'Cohort Definition'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'cohort_definition_id', 'Cohort Definition');
    const response = await container.resolve(OmopDbOmopApi).cohortDefinitionsPutOne(id, { ...variables, cohort_definition_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).cohortDefinitionsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const cohortDefinitionName = item.cohort_definition_name;
    if (typeof cohortDefinitionName === 'string' && cohortDefinitionName.trim().length > 0) {
      return cohortDefinitionName;
    }
    if (typeof cohortDefinitionName === 'number') {
      return String(cohortDefinitionName);
    }
    const definitionTypeConceptId = item.definition_type_concept_id;
    if (typeof definitionTypeConceptId === 'string' && definitionTypeConceptId.length > 0) {
      const definitionTypeConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === definitionTypeConceptId);
      if (definitionTypeConceptIdOption?.label) {
        return definitionTypeConceptIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is still undefined at this first assignment, so the check is always true */
      if (!fallbackValue) {
        fallbackValue = definitionTypeConceptId;
      }
    }
    const subjectConceptId = item.subject_concept_id;
    if (typeof subjectConceptId === 'string' && subjectConceptId.length > 0) {
      const subjectConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === subjectConceptId);
      if (subjectConceptIdOption?.label) {
        return subjectConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = subjectConceptId;
      }
    }
    const cohortDefinitionDescription = item.cohort_definition_description;
    if (typeof cohortDefinitionDescription === 'string' && cohortDefinitionDescription.trim().length > 0) {
      return cohortDefinitionDescription;
    }
    if (typeof cohortDefinitionDescription === 'number') {
      return String(cohortDefinitionDescription);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- create values always have non-empty definition_type_concept_id and subject_concept_id (yup required), which set fallbackValue, and rows always have an id, so fallbackValue is always set here */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable: an edit row always has an id, and a create submit has non-empty required concept ids, so fallbackValue is set above */
    return t`New cohort definition`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      cohort_definition_description: string().nullable().notRequired(),
      cohort_definition_name: string().required(),
      cohort_definition_syntax: string().nullable().notRequired(),
      cohort_initiation_date: SchemaUtil.isoString.nullable().notRequired(),
      definition_type_concept_id: string().required(),
      subject_concept_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Cohort Definition Name`, name: 'cohort_definition_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Cohort Definition Description`, name: 'cohort_definition_description' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Definition Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'definition_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Cohort Definition Syntax`, name: 'cohort_definition_syntax' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Subject Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'subject_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Cohort Initiation Date`, name: 'cohort_initiation_date' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'cohort_definition_name', name: t`Cohort Definition Name` }),
      TableUtil.createTextColumn<Row>({ id: 'cohort_definition_description', name: t`Cohort Definition Description` }),
      TableUtil.createOptionsColumn<Row>({ id: 'definition_type_concept_id', name: t`Definition Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'cohort_definition_syntax', name: t`Cohort Definition Syntax` }),
      TableUtil.createOptionsColumn<Row>({ id: 'subject_concept_id', name: t`Subject Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'cohort_initiation_date', name: t`Cohort Initiation Date` }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new cohort definition`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.CohortDefinitionCrudCommand}
      defaultSortByField={'cohort_definition_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Cohort Definition`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.COHORT_DEFINITIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CohortDefinitionsAdminPage')}
      title={t`Cohort Definitions`}
      updateOne={updateOne}
    />
  );
};
