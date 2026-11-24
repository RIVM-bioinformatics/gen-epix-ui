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
  OmopDbConceptRelationship,
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
import { useRelationshipOptionsQuery } from '../../dataHooks/useRelationshipQuery';

type FormFields = OmitWithMetaData<OmopDbConceptRelationship, 'concept_relationship_id'>;
type Row = { id: string } & OmopDbConceptRelationship;
const toTableRow = (item: OmopDbConceptRelationship): Row => {
  return OmopDbAdminUtil.withId(item, 'concept_relationship_id', 'Concept Relationship');
};
export const ConceptRelationshipsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const relationshipOptionsQuery = useRelationshipOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, relationshipOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).conceptRelationshipsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).conceptRelationshipsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'concept_relationship_id', 'Concept Relationship'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'concept_relationship_id', 'Concept Relationship');
    const response = await container.resolve(OmopDbOmopApi).conceptRelationshipsPutOne(id, { ...variables, concept_relationship_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).conceptRelationshipsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const conceptId1 = item.concept_id_1;
    if (typeof conceptId1 === 'string' && conceptId1.length > 0) {
      const conceptId1Option = conceptOptionsQuery.options.find(candidate => candidate.value === conceptId1);
      if (conceptId1Option?.label) {
        return conceptId1Option.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined here (no earlier assignment), so the false arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = conceptId1;
      }
    }
    const conceptId2 = item.concept_id_2;
    if (typeof conceptId2 === 'string' && conceptId2.length > 0) {
      const conceptId2Option = conceptOptionsQuery.options.find(candidate => candidate.value === conceptId2);
      if (conceptId2Option?.label) {
        return conceptId2Option.label;
      }
      if (!fallbackValue) {
        fallbackValue = conceptId2;
      }
    }
    const relationshipId = item.relationship_id;
    if (typeof relationshipId === 'string' && relationshipId.length > 0) {
      const relationshipIdOption = relationshipOptionsQuery.options.find(candidate => candidate.value === relationshipId);
      if (relationshipIdOption?.label) {
        return relationshipIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = relationshipId;
      }
    }
    const validStartDate = item.valid_start_date;
    if (typeof validStartDate === 'string' && validStartDate.trim().length > 0) {
      return validStartDate;
    }
    if (typeof validStartDate === 'number') {
      return String(validStartDate);
    }
    /* v8 ignore else -- rows always have an id; create values always return at the start date check (yup casts the DATE value to a non-blank string) */
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore next 3 -- needs a blank start date and no id; create values always return at the start date check and rows always have an id */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the block above */
    return t`New concept relationship`;
  }, [conceptOptionsQuery.options, relationshipOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      concept_id_1: string().required(),
      concept_id_2: string().required(),
      invalid_reason: string().nullable().notRequired(),
      relationship_id: string().required(),
      valid_end_date: SchemaUtil.isoString.required(),
      valid_start_date: SchemaUtil.isoString.required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Concept ID 1`, loading: conceptOptionsQuery.isLoading, name: 'concept_id_1', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Concept ID 2`, loading: conceptOptionsQuery.isLoading, name: 'concept_id_2', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Relationship ID`, loading: relationshipOptionsQuery.isLoading, name: 'relationship_id', options: relationshipOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid Start Date`, name: 'valid_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid End Date`, name: 'valid_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Invalid Reason`, name: 'invalid_reason' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, relationshipOptionsQuery.isLoading, conceptOptionsQuery.options, relationshipOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'concept_id_1', name: t`Concept ID 1`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'concept_id_2', name: t`Concept ID 2`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'relationship_id', name: t`Relationship ID`, options: relationshipOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_start_date', name: t`Valid Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_end_date', name: t`Valid End Date` }),
      TableUtil.createTextColumn<Row>({ id: 'invalid_reason', name: t`Invalid Reason` }),
    ];
  }, [conceptOptionsQuery.options, relationshipOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new concept relationship`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ConceptRelationshipCrudCommand}
      defaultSortByField={'concept_id_1'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Concept Relationship`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CONCEPT_RELATIONSHIPS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptRelationshipsAdminPage')}
      title={t`Concept Relationships`}
      updateOne={updateOne}
    />
  );
};
