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
  OmopDbSourceToConceptMap,
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
import { useVocabularyOptionsQuery } from '../../dataHooks/useVocabularyQuery';

type FormFields = OmitWithMetaData<OmopDbSourceToConceptMap, 'source_to_concept_map_id'>;
type Row = { id: string } & OmopDbSourceToConceptMap;
const toTableRow = (item: OmopDbSourceToConceptMap): Row => {
  return OmopDbAdminUtil.withId(item, 'source_to_concept_map_id', 'Source To Concept Map');
};
export const SourceToConceptMapsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const vocabularyOptionsQuery = useVocabularyOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, vocabularyOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).sourceToConceptMapsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).sourceToConceptMapsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'source_to_concept_map_id', 'Source To Concept Map'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'source_to_concept_map_id', 'Source To Concept Map');
    const response = await container.resolve(OmopDbOmopApi).sourceToConceptMapsPutOne(id, { ...variables, source_to_concept_map_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).sourceToConceptMapsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const sourceCode = item.source_code;
    if (typeof sourceCode === 'string' && sourceCode.trim().length > 0) {
      return sourceCode;
    }
    if (typeof sourceCode === 'number') {
      return String(sourceCode);
    }
    const sourceCodeDescription = item.source_code_description;
    if (typeof sourceCodeDescription === 'string' && sourceCodeDescription.trim().length > 0) {
      return sourceCodeDescription;
    }
    if (typeof sourceCodeDescription === 'number') {
      return String(sourceCodeDescription);
    }
    const sourceConceptId = item.source_concept_id;
    if (typeof sourceConceptId === 'string' && sourceConceptId.length > 0) {
      const sourceConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === sourceConceptId);
      if (sourceConceptIdOption?.label) {
        return sourceConceptIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined at this point, so the check is always true */
      if (!fallbackValue) {
        fallbackValue = sourceConceptId;
      }
    }
    const sourceVocabularyId = item.source_vocabulary_id;
    if (typeof sourceVocabularyId === 'string' && sourceVocabularyId.length > 0) {
      const sourceVocabularyIdOption = vocabularyOptionsQuery.options.find(candidate => candidate.value === sourceVocabularyId);
      if (sourceVocabularyIdOption?.label) {
        return sourceVocabularyIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = sourceVocabularyId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- a create always sets fallbackValue from source_concept_id or returns earlier, and edit rows return via id */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable: same proof as the preceding else ignore, so the translated fallback is never returned */
    return t`New source to concept map`;
  }, [conceptOptionsQuery.options, vocabularyOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      invalid_reason: string().nullable().notRequired(),
      source_code: string().required(),
      source_code_description: string().nullable().notRequired(),
      source_concept_id: string().required(),
      source_vocabulary_id: string().required(),
      target_concept_id: string().required(),
      target_vocabulary_id: string().required(),
      valid_end_date: SchemaUtil.isoString.required(),
      valid_start_date: SchemaUtil.isoString.required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Code`, name: 'source_code' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Source Vocabulary ID`, loading: vocabularyOptionsQuery.isLoading, name: 'source_vocabulary_id', options: vocabularyOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Code Description`, name: 'source_code_description' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Target Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'target_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Target Vocabulary ID`, loading: vocabularyOptionsQuery.isLoading, name: 'target_vocabulary_id', options: vocabularyOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid Start Date`, name: 'valid_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid End Date`, name: 'valid_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Invalid Reason`, name: 'invalid_reason' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, vocabularyOptionsQuery.isLoading, conceptOptionsQuery.options, vocabularyOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'source_code', name: t`Source Code` }),
      TableUtil.createOptionsColumn<Row>({ id: 'source_concept_id', name: t`Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'source_vocabulary_id', name: t`Source Vocabulary ID`, options: vocabularyOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'source_code_description', name: t`Source Code Description` }),
      TableUtil.createOptionsColumn<Row>({ id: 'target_concept_id', name: t`Target Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'target_vocabulary_id', name: t`Target Vocabulary ID`, options: vocabularyOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_start_date', name: t`Valid Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_end_date', name: t`Valid End Date` }),
      TableUtil.createTextColumn<Row>({ id: 'invalid_reason', name: t`Invalid Reason` }),
    ];
  }, [conceptOptionsQuery.options, vocabularyOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new source to concept map`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.SourceToConceptMapCrudCommand}
      defaultSortByField={'source_code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Source To Concept Map`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.SOURCE_TO_CONCEPT_MAPS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('SourceToConceptMapsAdminPage')}
      title={t`Source To Concept Maps`}
      updateOne={updateOne}
    />
  );
};
