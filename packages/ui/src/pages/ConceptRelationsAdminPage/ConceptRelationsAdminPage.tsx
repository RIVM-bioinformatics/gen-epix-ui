import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
  string,
} from 'yup';
import type { ConceptRelation } from '@gen-epix/api-casedb';
import {
  CommandName,
  ConceptRelationType,
  OntologyApi,
} from '@gen-epix/api-casedb';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import {
  useConceptMapQuery,
  useConceptNameFactory,
  useConceptOptionsQuery,
} from '../../dataHooks/useConceptQuery';
import { useArray } from '../../hooks/useArray';
import { useConceptRelationTypeOptionsQuery } from '../../dataHooks/useConceptRelationTypeQuery';
import type { OmitWithMetaData } from '../../models/data';


type FormFields = OmitWithMetaData<ConceptRelation, 'from_concept' | 'id' | 'to_concept'>;

export const ConceptRelationsAdminPage = () => {
  const { t } = useTranslation();

  const conceptMapQuery = useConceptMapQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const conceptRelationTypeOptionsQuery = useConceptRelationTypeOptionsQuery();
  const nameFactory = useConceptNameFactory();

  const loadables = useArray([conceptOptionsQuery, conceptMapQuery, conceptRelationTypeOptionsQuery, nameFactory]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.instance.conceptRelationsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: ConceptRelation) => {
    return await OntologyApi.instance.conceptRelationsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: ConceptRelation) => {
    return (await OntologyApi.instance.conceptRelationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.instance.conceptRelationsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: ConceptRelation) => {
    const fromConcept = conceptMapQuery.map.get(item.from_concept_id);
    const toConcept = conceptMapQuery.map.get(item.to_concept_id);
    if (fromConcept && toConcept) {
      return `${fromConcept.name} -> ${toConcept.name}`;
    }
    return `${item.from_concept_id} -> ${item.to_concept_id}`;
  }, [conceptMapQuery.map]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      from_concept_id: string().uuid4().required(),
      relation: mixed<ConceptRelationType>().required().oneOf(Object.values(ConceptRelationType)),
      to_concept_id: string().uuid4().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`From Concept`,
        loading: conceptOptionsQuery.isLoading,
        name: 'from_concept_id',
        options: conceptOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`To Concept`,
        loading: conceptOptionsQuery.isLoading,
        name: 'to_concept_id',
        options: conceptOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Relation`,
        loading: conceptRelationTypeOptionsQuery.isLoading,
        name: 'relation',
        options: conceptRelationTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, conceptRelationTypeOptionsQuery.isLoading, conceptRelationTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<ConceptRelation>[] => {
    return [
      TableUtil.createOptionsColumn<ConceptRelation>({ id: 'from_concept_id', name: t`From Concept`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<ConceptRelation>({ id: 'to_concept_id', name: t`To Concept`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<ConceptRelation>({ id: 'relation', name: t`Relation`, options: conceptRelationTypeOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, conceptRelationTypeOptionsQuery.options, t]);


  return (
    <CrudPage<FormFields, ConceptRelation>
      createItemDialogTitle={t`Create new concept relation`}
      createOne={createOne}
      crudCommandType={CommandName.ConceptRelationCrudCommand}
      defaultSortByField={'from_concept_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CONCEPT_RELATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptRelationsAdminPage')}
      title={t`Concept Relations`}
      updateOne={updateOne}
    />
  );
};
