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
  OmopDbConceptSynonym,
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

type FormFields = OmitWithMetaData<OmopDbConceptSynonym, 'concept_synonym_id'>;
type Row = { id: string } & OmopDbConceptSynonym;
const toTableRow = (item: OmopDbConceptSynonym): Row => {
  return OmopDbAdminUtil.withId(item, 'concept_synonym_id', 'Concept Synonym');
};
export const ConceptSynonymsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).conceptSynonymsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).conceptSynonymsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'concept_synonym_id', 'Concept Synonym'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'concept_synonym_id', 'Concept Synonym');
    const response = await container.resolve(OmopDbOmopApi).conceptSynonymsPutOne(id, { ...variables, concept_synonym_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).conceptSynonymsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const conceptSynonymName = item.concept_synonym_name;
    if (typeof conceptSynonymName === 'string' && conceptSynonymName.trim().length > 0) {
      return conceptSynonymName;
    }
    if (typeof conceptSynonymName === 'number') {
      return String(conceptSynonymName);
    }
    const conceptId = item.concept_id;
    if (typeof conceptId === 'string' && conceptId.length > 0) {
      const conceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === conceptId);
      if (conceptIdOption?.label) {
        return conceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = conceptId;
      }
    }
    const languageConceptId = item.language_concept_id;
    if (typeof languageConceptId === 'string' && languageConceptId.length > 0) {
      const languageConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === languageConceptId);
      if (languageConceptIdOption?.label) {
        return languageConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = languageConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New concept synonym`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      concept_id: string().required(),
      concept_synonym_name: string().required(),
      language_concept_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Concept Synonym Name`, name: 'concept_synonym_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Language Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'language_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'concept_id', name: t`Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'concept_synonym_name', name: t`Concept Synonym Name` }),
      TableUtil.createOptionsColumn<Row>({ id: 'language_concept_id', name: t`Language Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new concept synonym`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ConceptSynonymCrudCommand}
      defaultSortByField={'concept_synonym_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Concept Synonym`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CONCEPT_SYNONYMS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptSynonymsAdminPage')}
      title={t`Concept Synonyms`}
      updateOne={updateOne}
    />
  );
};
