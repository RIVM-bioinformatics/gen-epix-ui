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
import { useParams } from 'react-router-dom';

import type { Concept } from '../../api';
import {
  OntologyApi,
  CommandName,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Omit<Concept, 'id' | 'concept_set_id' | 'concept_set' | 'props'>;

export const ConceptsAdminPage = () => {
  const { conceptSetId } = useParams();
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.getInstance().conceptsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((concepts: Concept[]) => {
    return concepts.filter((concept) => concept.concept_set_id === conceptSetId);
  }, [conceptSetId]);

  const deleteOne = useCallback(async (item: Concept) => {
    return await OntologyApi.getInstance().conceptsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Concept) => {
    const updatedItem = (await OntologyApi.getInstance().conceptsPutOne(item.id, {
      ...variables,
      id: item.id,
      concept_set_id: conceptSetId,
    })).data;
    return updatedItem;
  }, [conceptSetId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.getInstance().conceptsPostOne({
      ...variables,
      concept_set_id: conceptSetId,
    })).data;
  }, [conceptSetId]);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().freeFormText().required().max(100),
      code: string().freeFormText().required().max(100),
      rank: number().required().min(0),
      description: string().freeFormText().max(1000),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        rows: 4,
        multiline: true,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Concept>[] => {
    return [
      TableUtil.createNumberColumn<Concept>({ id: 'rank', name: t`Rank`, flex: 0.25 }),
      TableUtil.createTextColumn<Concept>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<Concept>({ id: 'code', name: t`Code` }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: Concept): Concept => {
    return {
      id: previousItem.id,
      concept_set_id: previousItem.concept_set_id,
      ...variables,
    };
  }, []);

  return (
    <CrudPage<FormFields, Concept>
      createOne={createOne}
      crudCommandType={CommandName.ConceptCrudCommand}
      defaultSortByField={'rank'}
      defaultSortDirection={'asc'}
      fetchAllSelect={fetchAllSelect}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      getOptimisticUpdateIntermediateItem={getOptimisticUpdateIntermediateItem}
      resourceQueryKeyBase={QUERY_KEY.CONCEPTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptsAdminPage')}
      title={t`Concepts`}
      updateOne={updateOne}
    />
  );
};
