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
  OmopDbDrugStrength,
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

type FormFields = OmitWithMetaData<OmopDbDrugStrength, 'drug_strength_id'>;
type Row = { id: string } & OmopDbDrugStrength;
const toTableRow = (item: OmopDbDrugStrength): Row => {
  return OmopDbAdminUtil.withId(item, 'drug_strength_id', 'Drug Strength');
};
export const DrugStrengthsAdminPage = () => {
  const { t } = useTranslation();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const loadables = useArray([conceptOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).drugStrengthsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).drugStrengthsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'drug_strength_id', 'Drug Strength'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'drug_strength_id', 'Drug Strength');
    const response = await container.resolve(OmopDbOmopApi).drugStrengthsPutOne(id, { ...variables, drug_strength_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).drugStrengthsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const drugConceptId = item.drug_concept_id;
    if (typeof drugConceptId === 'string' && drugConceptId.length > 0) {
      const drugConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === drugConceptId);
      if (drugConceptIdOption?.label) {
        return drugConceptIdOption.label;
      }
      /* v8 ignore else -- first fallback check: fallbackValue is still undefined here, so the else arm is unreachable */
      if (!fallbackValue) {
        fallbackValue = drugConceptId;
      }
    }
    const ingredientConceptId = item.ingredient_concept_id;
    if (typeof ingredientConceptId === 'string' && ingredientConceptId.length > 0) {
      const ingredientConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === ingredientConceptId);
      if (ingredientConceptIdOption?.label) {
        return ingredientConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = ingredientConceptId;
      }
    }
    const amountUnitConceptId = item.amount_unit_concept_id;
    if (typeof amountUnitConceptId === 'string' && amountUnitConceptId.length > 0) {
      const amountUnitConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === amountUnitConceptId);
      if (amountUnitConceptIdOption?.label) {
        return amountUnitConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = amountUnitConceptId;
      }
    }
    const numeratorUnitConceptId = item.numerator_unit_concept_id;
    if (typeof numeratorUnitConceptId === 'string' && numeratorUnitConceptId.length > 0) {
      const numeratorUnitConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === numeratorUnitConceptId);
      if (numeratorUnitConceptIdOption?.label) {
        return numeratorUnitConceptIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = numeratorUnitConceptId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- validated create data always has a non-empty drug_concept_id, and items with an id return above, so fallbackValue is always set here */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the else comment above; the fallback always returns */
    return t`New drug strength`;
  }, [conceptOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      amount_unit_concept_id: string().nullable().notRequired(),
      amount_value: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      box_size: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      denominator_unit_concept_id: string().nullable().notRequired(),
      denominator_value: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      drug_concept_id: string().required(),
      ingredient_concept_id: string().required(),
      invalid_reason: string().nullable().notRequired(),
      numerator_unit_concept_id: string().nullable().notRequired(),
      numerator_value: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      valid_end_date: SchemaUtil.isoString.required(),
      valid_start_date: SchemaUtil.isoString.required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Drug Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'drug_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Ingredient Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'ingredient_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Amount Value`, name: 'amount_value', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Amount Unit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'amount_unit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Numerator Value`, name: 'numerator_value', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Numerator Unit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'numerator_unit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Denominator Value`, name: 'denominator_value', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Denominator Unit Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'denominator_unit_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Box Size`, name: 'box_size', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid Start Date`, name: 'valid_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Valid End Date`, name: 'valid_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Invalid Reason`, name: 'invalid_reason' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [conceptOptionsQuery.isLoading, conceptOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'drug_concept_id', name: t`Drug Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'ingredient_concept_id', name: t`Ingredient Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'amount_value', name: t`Amount Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'amount_unit_concept_id', name: t`Amount Unit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'numerator_value', name: t`Numerator Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'numerator_unit_concept_id', name: t`Numerator Unit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'denominator_value', name: t`Denominator Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'denominator_unit_concept_id', name: t`Denominator Unit Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'box_size', name: t`Box Size` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_start_date', name: t`Valid Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'valid_end_date', name: t`Valid End Date` }),
      TableUtil.createTextColumn<Row>({ id: 'invalid_reason', name: t`Invalid Reason` }),
    ];
  }, [conceptOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new drug strength`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.DrugStrengthCrudCommand}
      defaultSortByField={'drug_concept_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Drug Strength`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.DRUG_STRENGTHS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DrugStrengthsAdminPage')}
      title={t`Drug Strengths`}
      updateOne={updateOne}
    />
  );
};
