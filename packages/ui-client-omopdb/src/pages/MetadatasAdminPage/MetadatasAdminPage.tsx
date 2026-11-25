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
  OmopDbMetadata,
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

type FormFields = OmitWithMetaData<OmopDbMetadata, 'metadata_id'>;
type Row = { id: string } & OmopDbMetadata;
const toTableRow = (item: OmopDbMetadata): Row => {
  return OmopDbAdminUtil.withId(item, 'metadata_id', 'Metadata');
};
export const MetadatasAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).metadatasGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).metadatasDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'metadata_id', 'Metadata'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'metadata_id', 'Metadata');
    const response = await container.resolve(OmopDbOmopApi).metadatasPutOne(id, { ...variables, metadata_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).metadatasPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    const name = item.name;
    if (typeof name === 'string' && name.trim().length > 0) {
      return name;
    }
    if (typeof name === 'number') {
      return String(name);
    }
    const conceptIds = [item.metadata_concept_id, item.metadata_type_concept_id, item.value_as_concept_id].filter((conceptId): conceptId is string => typeof conceptId === 'string' && conceptId.length > 0);
    for (const conceptId of conceptIds) {
      const label = conceptOptionsQuery.options.find(candidate => candidate.value === conceptId)?.label;
      if (label) {
        return label;
      }
    }
    /* v8 ignore start -- unsaved items are validated to have a non-empty name, and API rows always have a string id, so the fallbacks below only run for malformed data */
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (conceptIds.length > 0) {
      return conceptIds[0];
    }
    return t`New metadata`;
    /* v8 ignore stop */
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      metadata_concept_id: string().required(),
      metadata_date: SchemaUtil.isoString.nullable().notRequired(),
      metadata_datetime: SchemaUtil.isoString.nullable().notRequired(),
      metadata_type_concept_id: string().required(),
      name: SchemaUtil.name,
      value_as_concept_id: string().nullable().notRequired(),
      value_as_number: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      value_as_string: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Metadata Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'metadata_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Metadata Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'metadata_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Name`, name: 'name' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Value As String`, name: 'value_as_string' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Value As Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'value_as_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Value As Number`, name: 'value_as_number', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Metadata Date`, name: 'metadata_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE_TIME, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Metadata Datetime`, name: 'metadata_datetime' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'metadata_concept_id', name: t`Metadata Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'metadata_type_concept_id', name: t`Metadata Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<Row>({ id: 'value_as_string', name: t`Value As String` }),
      TableUtil.createOptionsColumn<Row>({ id: 'value_as_concept_id', name: t`Value As Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'value_as_number', name: t`Value As Number` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'metadata_date', name: t`Metadata Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'metadata_datetime', name: t`Metadata Datetime` }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new metadata`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.MetadataCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Metadata`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.METADATAS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('MetadatasAdminPage')}
      title={t`Metadatas`}
      updateOne={updateOne}
    />
  );
};
