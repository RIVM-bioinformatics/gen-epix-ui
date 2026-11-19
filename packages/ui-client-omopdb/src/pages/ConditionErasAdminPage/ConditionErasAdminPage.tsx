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
  OmopDbConditionEra,
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
import { usePersonOptionsQuery } from '../../dataHooks/usePersonQuery';

type FormFields = OmitWithMetaData<OmopDbConditionEra, 'condition_era_id'>;
type Row = { id: string } & OmopDbConditionEra;
const toTableRow = (item: OmopDbConditionEra): Row => {
  return OmopDbAdminUtil.withId(item, 'condition_era_id', 'Condition Era');
};
export const ConditionErasAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, personOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).conditionErasGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).conditionErasDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'condition_era_id', 'Condition Era'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'condition_era_id', 'Condition Era');
    const response = await container.resolve(OmopDbOmopApi).conditionErasPutOne(id, { ...variables, condition_era_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).conditionErasPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const personId = item.person_id;
    if (typeof personId === 'string' && personId.length > 0) {
      const personIdOption = personOptionsQuery.options.find(candidate => candidate.value === personId);
      if (personIdOption?.label) {
        return personIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    const conditionConceptId = item.condition_concept_id;
    if (typeof conditionConceptId === 'string' && conditionConceptId.length > 0) {
      const conditionConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === conditionConceptId);
      if (conditionConceptIdOption?.label) {
        return conditionConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = conditionConceptId;
      }
    }
    const provenanceId = item.provenance_id;
    if (typeof provenanceId === 'string' && provenanceId.trim().length > 0) {
      return provenanceId;
    }
    if (typeof provenanceId === 'number') {
      return String(provenanceId);
    }
    const sourceTraceback = item.source_traceback;
    if (typeof sourceTraceback === 'string' && sourceTraceback.trim().length > 0) {
      return sourceTraceback;
    }
    if (typeof sourceTraceback === 'number') {
      return String(sourceTraceback);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New condition era`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      condition_concept_id: string().required(),
      condition_era_end_date: string().required(),
      condition_era_start_date: string().required(),
      condition_occurrence_count: number().nullable().notRequired(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Condition Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'condition_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Condition Era Start Date`, name: 'condition_era_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Condition Era End Date`, name: 'condition_era_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Condition Occurrence Count`, name: 'condition_occurrence_count' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, conceptOptionsQuery.options, personOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'condition_concept_id', name: t`Condition Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'condition_era_start_date', name: t`Condition Era Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'condition_era_end_date', name: t`Condition Era End Date` }),
      TableUtil.createNumberColumn<Row>({ id: 'condition_occurrence_count', name: t`Condition Occurrence Count` }),
    ];
  }, [conceptOptionsQuery.options, personOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new condition era`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.ConditionEraCrudCommand}
      defaultSortByField={'person_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Condition Era`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.CONDITION_ERAS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('ConditionErasAdminPage')}
      title={t`Condition Eras`}
      updateOne={updateOne}
    />
  );
};
