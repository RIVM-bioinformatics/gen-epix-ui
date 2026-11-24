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
  OmopDbDrugEra,
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

type FormFields = OmitWithMetaData<OmopDbDrugEra, 'drug_era_id'>;
type Row = { id: string } & OmopDbDrugEra;
const toTableRow = (item: OmopDbDrugEra): Row => {
  return OmopDbAdminUtil.withId(item, 'drug_era_id', 'Drug Era');
};
export const DrugErasAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, personOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).drugErasGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).drugErasDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'drug_era_id', 'Drug Era'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'drug_era_id', 'Drug Era');
    const response = await container.resolve(OmopDbOmopApi).drugErasPutOne(id, { ...variables, drug_era_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).drugErasPostOne(variables);
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
      /* v8 ignore else -- fallbackValue is always undefined at the first check, so the else arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = personId;
      }
    }
    const drugConceptId = item.drug_concept_id;
    if (typeof drugConceptId === 'string' && drugConceptId.length > 0) {
      const drugConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === drugConceptId);
      if (drugConceptIdOption?.label) {
        return drugConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = drugConceptId;
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
    /* v8 ignore else -- person_id is required (rejects '', so length > 0 holds) and rows always have an id */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable: same reason as the else above */
    return t`New drug era`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      drug_concept_id: string().required(),
      drug_era_end_date: SchemaUtil.isoString.required(),
      drug_era_end_iso_interval: string().nullable().notRequired(),
      drug_era_start_date: SchemaUtil.isoString.required(),
      drug_era_start_iso_interval: string().nullable().notRequired(),
      drug_exposure_count: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      gap_days: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
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
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Drug Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'drug_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Drug Era Start Date`, name: 'drug_era_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Drug Era End Date`, name: 'drug_era_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Drug Exposure Count`, name: 'drug_exposure_count', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Gap Days`, name: 'gap_days', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Drug Era Start ISO Interval`, name: 'drug_era_start_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Drug Era End ISO Interval`, name: 'drug_era_end_iso_interval' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, conceptOptionsQuery.options, personOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'drug_concept_id', name: t`Drug Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'drug_era_start_date', name: t`Drug Era Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'drug_era_end_date', name: t`Drug Era End Date` }),
      TableUtil.createNumberColumn<Row>({ id: 'drug_exposure_count', name: t`Drug Exposure Count` }),
      TableUtil.createNumberColumn<Row>({ id: 'gap_days', name: t`Gap Days` }),
      TableUtil.createTextColumn<Row>({ id: 'drug_era_start_iso_interval', name: t`Drug Era Start ISO Interval` }),
      TableUtil.createTextColumn<Row>({ id: 'drug_era_end_iso_interval', name: t`Drug Era End ISO Interval` }),
    ];
  }, [conceptOptionsQuery.options, personOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new drug era`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DrugEraCrudCommand}
      defaultSortByField={'person_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Drug Era`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DRUG_ERAS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DrugErasAdminPage')}
      title={t`Drug Eras`}
      updateOne={updateOne}
    />
  );
};
