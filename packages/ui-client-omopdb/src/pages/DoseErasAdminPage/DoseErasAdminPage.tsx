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
  OmopDbDoseEra,
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

type FormFields = OmitWithMetaData<OmopDbDoseEra, 'dose_era_id'>;
type Row = { id: string } & OmopDbDoseEra;
const toTableRow = (item: OmopDbDoseEra): Row => {
  return OmopDbAdminUtil.withId(item, 'dose_era_id', 'Dose Era');
};
export const DoseErasAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const loadables = useArray([conceptOptionsQuery, personOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).doseErasGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).doseErasDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'dose_era_id', 'Dose Era'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'dose_era_id', 'Dose Era');
    const response = await container.resolve(OmopDbOmopApi).doseErasPutOne(id, { ...variables, dose_era_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).doseErasPostOne(variables);
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
    const unitConceptId = item.unit_concept_id;
    if (typeof unitConceptId === 'string' && unitConceptId.length > 0) {
      const unitConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === unitConceptId);
      if (unitConceptIdOption?.label) {
        return unitConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = unitConceptId;
      }
    }
    const provenanceId = item.provenance_id;
    if (typeof provenanceId === 'string' && provenanceId.trim().length > 0) {
      return provenanceId;
    }
    if (typeof provenanceId === 'number') {
      return String(provenanceId);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    if (fallbackValue) {
      return fallbackValue;
    }
    return t`New dose era`;
  }, [personOptionsQuery.options, conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      dose_era_end_date: string().required(),
      dose_era_start_date: string().required(),
      dose_value: number().required(),
      drug_concept_id: string().required(),
      person_id: string().required(),
      provenance_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      unit_concept_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Drug Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'drug_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Unit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'unit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER, label: t`Dose Value`, name: 'dose_value' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Dose Era Start Date`, name: 'dose_era_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Dose Era End Date`, name: 'dose_era_end_date' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, conceptOptionsQuery.options, personOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'drug_concept_id', name: t`Drug Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'unit_concept_id', name: t`Unit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'dose_value', name: t`Dose Value` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'dose_era_start_date', name: t`Dose Era Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'dose_era_end_date', name: t`Dose Era End Date` }),
    ];
  }, [conceptOptionsQuery.options, personOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new dose era`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DoseEraCrudCommand}
      defaultSortByField={'person_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Dose Era`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DOSE_ERAS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DoseErasAdminPage')}
      title={t`Dose Eras`}
      updateOne={updateOne}
    />
  );
};
