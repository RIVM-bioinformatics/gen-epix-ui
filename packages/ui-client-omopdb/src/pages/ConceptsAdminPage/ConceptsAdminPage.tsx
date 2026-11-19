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
  OmopDbConcept,
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
import { useConceptClassOptionsQuery } from '../../dataHooks/useConceptClassQuery';
import { useDomainOptionsQuery } from '../../dataHooks/useDomainQuery';
import { useVocabularyOptionsQuery } from '../../dataHooks/useVocabularyQuery';

type FormFields = OmitWithMetaData<OmopDbConcept, 'concept_id'>;
type Row = { id: string } & OmopDbConcept;
const toTableRow = (item: OmopDbConcept): Row => {
  return OmopDbAdminUtil.withId(item, 'concept_id', 'Concept');
};
export const ConceptsAdminPage = () => {
  const { t } = useTranslation();
  const conceptClassOptionsQuery = useConceptClassOptionsQuery();
  const domainOptionsQuery = useDomainOptionsQuery();
  const vocabularyOptionsQuery = useVocabularyOptionsQuery();
  const loadables = useArray([conceptClassOptionsQuery, domainOptionsQuery, vocabularyOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).conceptsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).conceptsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'concept_id', 'Concept'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'concept_id', 'Concept');
    const response = await container.resolve(OmopDbOmopApi).conceptsPutOne(id, { ...variables, concept_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).conceptsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const conceptName = item.concept_name;
    if (typeof conceptName === 'string' && conceptName.trim().length > 0) {
      return conceptName;
    }
    if (typeof conceptName === 'number') {
      return String(conceptName);
    }
    const conceptCode = item.concept_code;
    if (typeof conceptCode === 'string' && conceptCode.trim().length > 0) {
      return conceptCode;
    }
    if (typeof conceptCode === 'number') {
      return String(conceptCode);
    }
    const domainId = item.domain_id;
    if (typeof domainId === 'string' && domainId.length > 0) {
      const domainIdOption = domainOptionsQuery.options.find(candidate => candidate.value === domainId);
      if (domainIdOption?.label) {
        return domainIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = domainId;
      }
    }
    const vocabularyId = item.vocabulary_id;
    if (typeof vocabularyId === 'string' && vocabularyId.length > 0) {
      const vocabularyIdOption = vocabularyOptionsQuery.options.find(candidate => candidate.value === vocabularyId);
      if (vocabularyIdOption?.label) {
        return vocabularyIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = vocabularyId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New concept`;
  }, [domainOptionsQuery.options, vocabularyOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      concept_class_id: string().required(),
      concept_code: string().required(),
      concept_int_id: number().nullable().notRequired(),
      concept_name: string().required(),
      domain_id: string().required(),
      invalid_reason: string().nullable().notRequired(),
      standard_concept: string().nullable().notRequired(),
      valid_end_date: string().required(),
      valid_start_date: string().required(),
      vocabulary_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Concept Int ID`, name: 'concept_int_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Concept Name`, name: 'concept_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Domain ID`, loading: domainOptionsQuery.isLoading, name: 'domain_id', options: domainOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Vocabulary ID`, loading: vocabularyOptionsQuery.isLoading, name: 'vocabulary_id', options: vocabularyOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Concept Class ID`, loading: conceptClassOptionsQuery.isLoading, name: 'concept_class_id', options: conceptClassOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Standard Concept`, name: 'standard_concept' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Concept Code`, name: 'concept_code' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid Start Date`, name: 'valid_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid End Date`, name: 'valid_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Invalid Reason`, name: 'invalid_reason' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptClassOptionsQuery.isLoading, domainOptionsQuery.isLoading, vocabularyOptionsQuery.isLoading, conceptClassOptionsQuery.options, domainOptionsQuery.options, vocabularyOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createNumberColumn<Row>({ id: 'concept_int_id', name: t`Concept Int ID` }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'concept_name', name: t`Concept Name` }),
      TableUtil.createOptionsColumn<Row>({ id: 'domain_id', name: t`Domain ID`, options: domainOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'vocabulary_id', name: t`Vocabulary ID`, options: vocabularyOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'concept_class_id', name: t`Concept Class ID`, options: conceptClassOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'standard_concept', name: t`Standard Concept` }),
      TableUtil.createTextColumn<Row>({ id: 'concept_code', name: t`Concept Code` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_start_date', name: t`Valid Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_end_date', name: t`Valid End Date` }),
      TableUtil.createTextColumn<Row>({ id: 'invalid_reason', name: t`Invalid Reason` }),
    ];
  }, [conceptClassOptionsQuery.options, domainOptionsQuery.options, vocabularyOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new concept`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ConceptCrudCommand}
      defaultSortByField={'concept_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Concept`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CONCEPTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptsAdminPage')}
      title={t`Concepts`}
      updateOne={updateOne}
    />
  );
};
