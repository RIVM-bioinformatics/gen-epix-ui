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
  OmopDbConceptClass,
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

type FormFields = OmitWithMetaData<OmopDbConceptClass, 'concept_class_id'>;
type Row = { id: string } & OmopDbConceptClass;
const toTableRow = (item: OmopDbConceptClass): Row => {
  return OmopDbAdminUtil.withId(item, 'concept_class_id', 'Concept Class');
};
export const ConceptClassesAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).conceptClasssGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).conceptClasssDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'concept_class_id', 'Concept Class'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'concept_class_id', 'Concept Class');
    const response = await container.resolve(OmopDbOmopApi).conceptClasssPutOne(id, { ...variables, concept_class_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).conceptClasssPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const conceptClassName = item.concept_class_name;
    if (typeof conceptClassName === 'string' && conceptClassName.trim().length > 0) {
      return conceptClassName;
    }
    if (typeof conceptClassName === 'number') {
      return String(conceptClassName);
    }
    const conceptClassStrId = item.concept_class_str_id;
    if (typeof conceptClassStrId === 'string' && conceptClassStrId.trim().length > 0) {
      return conceptClassStrId;
    }
    if (typeof conceptClassStrId === 'number') {
      return String(conceptClassStrId);
    }
    const conceptClassConceptId = item.concept_class_concept_id;
    if (typeof conceptClassConceptId === 'string' && conceptClassConceptId.length > 0) {
      const conceptClassConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === conceptClassConceptId);
      if (conceptClassConceptIdOption?.label) {
        return conceptClassConceptIdOption.label;
      }
      /* v8 ignore else -- fallbackValue is always undefined at this first assignment, so the false arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = conceptClassConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- concept_class_concept_id is a required non-empty string on submitted values, so fallbackValue is set whenever this is reached; rows always return at the id check */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the else skip above */
    return t`New concept class`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      concept_class_concept_id: string().required(),
      concept_class_name: string().required(),
      concept_class_str_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Concept Class Str ID`, name: 'concept_class_str_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Concept Class Name`, name: 'concept_class_name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Concept Class Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'concept_class_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'concept_class_str_id', name: t`Concept Class Str ID` }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'concept_class_name', name: t`Concept Class Name` }),
      TableUtil.createOptionsColumn<Row>({ id: 'concept_class_concept_id', name: t`Concept Class Concept ID`, options: conceptOptionsQuery.options }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new concept class`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ConceptClassCrudCommand}
      defaultSortByField={'concept_class_name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Concept Class`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CONCEPT_CLASSES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConceptClassesAdminPage')}
      title={t`Concept classes`}
      updateOne={updateOne}
    />
  );
};
