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
  OmopDbRelationship,
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
import { useRelationshipOptionsQuery } from '../../dataHooks/useRelationshipQuery';

type FormFields = OmitWithMetaData<OmopDbRelationship, 'relationship_id'>;
type Row = { id: string } & OmopDbRelationship;
const toTableRow = (item: OmopDbRelationship): Row => {
  return OmopDbAdminUtil.withId(item, 'relationship_id', 'Relationship');
};
export const RelationshipsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const relationshipOptionsQuery = useRelationshipOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, relationshipOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).relationshipsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).relationshipsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'relationship_id', 'Relationship'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'relationship_id', 'Relationship');
    const response = await container.resolve(OmopDbOmopApi).relationshipsPutOne(id, { ...variables, relationship_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).relationshipsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const relationshipName = item.relationship_name;
    if (typeof relationshipName === 'string' && relationshipName.trim().length > 0) {
      return relationshipName;
    }
    if (typeof relationshipName === 'number') {
      return String(relationshipName);
    }
    const relationshipStrId = item.relationship_str_id;
    if (typeof relationshipStrId === 'string' && relationshipStrId.trim().length > 0) {
      return relationshipStrId;
    }
    if (typeof relationshipStrId === 'number') {
      return String(relationshipStrId);
    }
    const reverseRelationshipStrId = item.reverse_relationship_str_id;
    if (typeof reverseRelationshipStrId === 'string' && reverseRelationshipStrId.trim().length > 0) {
      return reverseRelationshipStrId;
    }
    if (typeof reverseRelationshipStrId === 'number') {
      return String(reverseRelationshipStrId);
    }
    const reverseRelationshipId = item.reverse_relationship_id;
    if (typeof reverseRelationshipId === 'string' && reverseRelationshipId.length > 0) {
      const reverseRelationshipIdOption = relationshipOptionsQuery.options.find(candidate => candidate.value === reverseRelationshipId);
      if (reverseRelationshipIdOption?.label) {
        return reverseRelationshipIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = reverseRelationshipId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New relationship`;
  }, [relationshipOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      defines_ancestry: string().required(),
      is_hierarchical: string().required(),
      relationship_concept_id: string().required(),
      relationship_name: string().required(),
      relationship_str_id: string().required(),
      reverse_relationship_id: string().required(),
      reverse_relationship_str_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Relationship Str ID`, name: 'relationship_str_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Relationship Name`, name: 'relationship_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Is Hierarchical`, name: 'is_hierarchical' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Defines Ancestry`, name: 'defines_ancestry' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Reverse Relationship ID`, loading: relationshipOptionsQuery.isLoading, name: 'reverse_relationship_id', options: relationshipOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Reverse Relationship Str ID`, name: 'reverse_relationship_str_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Relationship Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'relationship_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, relationshipOptionsQuery.isLoading, conceptOptionsQuery.options, relationshipOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'relationship_str_id', name: t`Relationship Str ID` }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'relationship_name', name: t`Relationship Name` }),
      TableUtil.createTextColumn<Row>({ id: 'is_hierarchical', name: t`Is Hierarchical` }),
      TableUtil.createTextColumn<Row>({ id: 'defines_ancestry', name: t`Defines Ancestry` }),
      TableUtil.createOptionsColumn<Row>({ id: 'reverse_relationship_id', name: t`Reverse Relationship ID`, options: relationshipOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'reverse_relationship_str_id', name: t`Reverse Relationship Str ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'relationship_concept_id', name: t`Relationship Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, relationshipOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new relationship`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.RelationshipCrudCommand}
      defaultSortByField={'relationship_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Relationship`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.RELATIONSHIPS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RelationshipsAdminPage')}
      title={t`Relationships`}
      updateOne={updateOne}
    />
  );
};
