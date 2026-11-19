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
  OmopDbConceptAncestor,
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

type FormFields = OmitWithMetaData<OmopDbConceptAncestor, 'concept_ancestor_id'>;
type Row = { id: string } & OmopDbConceptAncestor;
const toTableRow = (item: OmopDbConceptAncestor): Row => {
  return OmopDbAdminUtil.withId(item, 'concept_ancestor_id', 'Concept Ancestor');
};
export const ConceptAncestorsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).conceptAncestorsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).conceptAncestorsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'concept_ancestor_id', 'Concept Ancestor'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'concept_ancestor_id', 'Concept Ancestor');
    const response = await container.resolve(OmopDbOmopApi).conceptAncestorsPutOne(id, { ...variables, concept_ancestor_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).conceptAncestorsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const ancestorConceptId = item.ancestor_concept_id;
    if (typeof ancestorConceptId === 'string' && ancestorConceptId.length > 0) {
      const ancestorConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === ancestorConceptId);
      if (ancestorConceptIdOption?.label) {
        return ancestorConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = ancestorConceptId;
      }
    }
    const descendantConceptId = item.descendant_concept_id;
    if (typeof descendantConceptId === 'string' && descendantConceptId.length > 0) {
      const descendantConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === descendantConceptId);
      if (descendantConceptIdOption?.label) {
        return descendantConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = descendantConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New concept ancestor`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      ancestor_concept_id: string().required(),
      descendant_concept_id: string().required(),
      max_levels_of_separation: number().required(),
      min_levels_of_separation: number().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Ancestor Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'ancestor_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Descendant Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'descendant_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Min Levels Of Separation`, name: 'min_levels_of_separation' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Max Levels Of Separation`, name: 'max_levels_of_separation' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'ancestor_concept_id', name: t`Ancestor Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'descendant_concept_id', name: t`Descendant Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'min_levels_of_separation', name: t`Min Levels Of Separation` }),
      TableUtil.createNumberColumn<Row>({ id: 'max_levels_of_separation', name: t`Max Levels Of Separation` }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new concept ancestor`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ConceptAncestorCrudCommand}
      defaultSortByField={'ancestor_concept_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Concept Ancestor`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CONCEPT_ANCESTORS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptAncestorsAdminPage')}
      title={t`Concept Ancestors`}
      updateOne={updateOne}
    />
  );
};
