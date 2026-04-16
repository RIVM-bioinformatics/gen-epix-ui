import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { object } from 'yup';
import { useParams } from 'react-router-dom';
import type { CaseDbConcept } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOntologyApi,
} from '@gen-epix/api-casedb';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<CaseDbConcept, 'concept_set_id' | 'concept_set' | 'props'>;

export const ConceptsAdminPage = () => {
  const { conceptSetId } = useParams();
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbOntologyApi.instance.conceptsGetAll({ signal }))?.data;
  }, []);

  const fetchAllSelect = useCallback((concepts: CaseDbConcept[]) => {
    return concepts.filter((concept) => concept.concept_set_id === conceptSetId);
  }, [conceptSetId]);

  const deleteOne = useCallback(async (item: CaseDbConcept) => {
    return await CaseDbOntologyApi.instance.conceptsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbConcept) => {
    const updatedItem = (await CaseDbOntologyApi.instance.conceptsPutOne(item.id, {
      ...variables,
      concept_set_id: conceptSetId,
      id: item.id,
    })).data;
    return updatedItem;
  }, [conceptSetId]);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbOntologyApi.instance.conceptsPostOne({
      ...variables,
      concept_set_id: conceptSetId,
    })).data;
  }, [conceptSetId]);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      description: SchemaUtil.description,
      name: SchemaUtil.name,
      rank: SchemaUtil.rank,
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Rank`,
        name: 'rank',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 4,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseDbConcept>[] => {
    return [
      TableUtil.createNumberColumn<CaseDbConcept>({ flex: 0.25, id: 'rank', name: t`Rank` }),
      TableUtil.createTextColumn<CaseDbConcept>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<CaseDbConcept>({ id: 'code', name: t`Code` }),
    ];
  }, [t]);

  const getOptimisticUpdateIntermediateItem = useCallback((variables: FormFields, previousItem: CaseDbConcept): CaseDbConcept => {
    return {
      concept_set_id: previousItem.concept_set_id,
      id: previousItem.id,
      ...variables,
    };
  }, []);

  return (
    <CrudPage<FormFields, CaseDbConcept>
      createItemDialogTitle={t`Create new concept`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.ConceptCrudCommand}
      defaultSortByField={'rank'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      fetchAllSelect={fetchAllSelect}
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
