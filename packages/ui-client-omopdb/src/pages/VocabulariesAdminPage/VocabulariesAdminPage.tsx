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
  OmopDbVocabulary,
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

type FormFields = OmitWithMetaData<OmopDbVocabulary, 'vocabulary_id'>;
type Row = { id: string } & OmopDbVocabulary;
const toTableRow = (item: OmopDbVocabulary): Row => {
  return OmopDbAdminUtil.withId(item, 'vocabulary_id', 'Vocabulary');
};
export const VocabulariesAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).vocabulariesGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).vocabulariesDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'vocabulary_id', 'Vocabulary'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'vocabulary_id', 'Vocabulary');
    const response = await container.resolve(OmopDbOmopApi).vocabulariesPutOne(id, { ...variables, vocabulary_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).vocabulariesPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const vocabularyName = item.vocabulary_name;
    if (typeof vocabularyName === 'string' && vocabularyName.trim().length > 0) {
      return vocabularyName;
    }
    if (typeof vocabularyName === 'number') {
      return String(vocabularyName);
    }
    const vocabularyStrId = item.vocabulary_str_id;
    if (typeof vocabularyStrId === 'string' && vocabularyStrId.trim().length > 0) {
      return vocabularyStrId;
    }
    if (typeof vocabularyStrId === 'number') {
      return String(vocabularyStrId);
    }
    const vocabularyConceptId = item.vocabulary_concept_id;
    if (typeof vocabularyConceptId === 'string' && vocabularyConceptId.length > 0) {
      const vocabularyConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === vocabularyConceptId);
      if (vocabularyConceptIdOption?.label) {
        return vocabularyConceptIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is only assigned in this block, so it is always undefined here and the else arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = vocabularyConceptId;
      }
    }
    const vocabularyReference = item.vocabulary_reference;
    if (typeof vocabularyReference === 'string' && vocabularyReference.trim().length > 0) {
      return vocabularyReference;
    }
    if (typeof vocabularyReference === 'number') {
      return String(vocabularyReference);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- rows always have a non-empty id (withId throws otherwise), and yup-validated create values always have a non-empty vocabulary_concept_id, so fallbackValue is set */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the preceding else ignore */
    return t`New vocabulary`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      vocabulary_concept_id: string().required(),
      vocabulary_name: string().required(),
      vocabulary_reference: string().nullable().notRequired(),
      vocabulary_str_id: string().required(),
      vocabulary_version: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Vocabulary Str ID`, name: 'vocabulary_str_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Vocabulary Name`, name: 'vocabulary_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Vocabulary Reference`, name: 'vocabulary_reference' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Vocabulary Version`, name: 'vocabulary_version' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Vocabulary Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'vocabulary_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'vocabulary_str_id', name: t`Vocabulary Str ID` }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'vocabulary_name', name: t`Vocabulary Name` }),
      TableUtil.createTextColumn<Row>({ id: 'vocabulary_reference', name: t`Vocabulary Reference` }),
      TableUtil.createTextColumn<Row>({ id: 'vocabulary_version', name: t`Vocabulary Version` }),
      TableUtil.createOptionsColumn<Row>({ id: 'vocabulary_concept_id', name: t`Vocabulary Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new vocabulary`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.VocabularyCrudCommand}
      defaultSortByField={'vocabulary_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Vocabulary`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.VOCABULARIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('VocabulariesAdminPage')}
      title={t`Vocabularies`}
      updateOne={updateOne}
    />
  );
};
