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
  OmopDbFactRelationship,
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

type FormFields = OmitWithMetaData<OmopDbFactRelationship, 'fact_relationship_id'>;
type Row = { id: string } & OmopDbFactRelationship;
const toTableRow = (item: OmopDbFactRelationship): Row => {
  return OmopDbAdminUtil.withId(item, 'fact_relationship_id', 'Fact Relationship');
};
export const FactRelationshipsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).factRelationshipsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).factRelationshipsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'fact_relationship_id', 'Fact Relationship'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'fact_relationship_id', 'Fact Relationship');
    const response = await container.resolve(OmopDbOmopApi).factRelationshipsPutOne(id, { ...variables, fact_relationship_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).factRelationshipsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const relationshipConceptId = item.relationship_concept_id;
    if (typeof relationshipConceptId === 'string' && relationshipConceptId.length > 0) {
      const relationshipConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === relationshipConceptId);
      if (relationshipConceptIdOption?.label) {
        return relationshipConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = relationshipConceptId;
      }
    }
    const domainConceptId1 = item.domain_concept_id_1;
    if (typeof domainConceptId1 === 'string' && domainConceptId1.trim().length > 0) {
      return domainConceptId1;
    }
    if (typeof domainConceptId1 === 'number') {
      return String(domainConceptId1);
    }
    const domainConceptId2 = item.domain_concept_id_2;
    if (typeof domainConceptId2 === 'string' && domainConceptId2.trim().length > 0) {
      return domainConceptId2;
    }
    if (typeof domainConceptId2 === 'number') {
      return String(domainConceptId2);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New fact relationship`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      domain_concept_id_1: string().required(),
      domain_concept_id_2: string().required(),
      fact_id_1: number().required(),
      fact_id_2: number().required(),
      relationship_concept_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Domain Concept ID 1`, name: 'domain_concept_id_1' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Fact ID 1`, name: 'fact_id_1' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Domain Concept ID 2`, name: 'domain_concept_id_2' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Fact ID 2`, name: 'fact_id_2' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Relationship Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'relationship_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'domain_concept_id_1', name: t`Domain Concept ID 1` }),
      TableUtil.createNumberColumn<Row>({ id: 'fact_id_1', name: t`Fact ID 1` }),
      TableUtil.createTextColumn<Row>({ id: 'domain_concept_id_2', name: t`Domain Concept ID 2` }),
      TableUtil.createNumberColumn<Row>({ id: 'fact_id_2', name: t`Fact ID 2` }),
      TableUtil.createOptionsColumn<Row>({ id: 'relationship_concept_id', name: t`Relationship Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new fact relationship`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.FactRelationshipCrudCommand}
      defaultSortByField={'relationship_concept_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Fact Relationship`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.FACT_RELATIONSHIPS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('FactRelationshipsAdminPage')}
      title={t`Fact Relationships`}
      updateOne={updateOne}
    />
  );
};
