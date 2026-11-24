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
  OmopDbCost,
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
import { useOrganizationOptionsQuery } from '@gen-epix/ui-client-common/dataHooks/useOrganizationsQuery';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { useDomainOptionsQuery } from '../../dataHooks/useDomainQuery';
import { usePayerPlanPeriodOptionsQuery } from '../../dataHooks/usePayerPlanPeriodQuery';

type FormFields = OmitWithMetaData<OmopDbCost, 'cost_id'>;
type Row = { id: string } & OmopDbCost;
const toTableRow = (item: OmopDbCost): Row => {
  return OmopDbAdminUtil.withId(item, 'cost_id', 'Cost');
};
export const CostsAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const domainOptionsQuery = useDomainOptionsQuery();
  const payerPlanPeriodOptionsQuery = usePayerPlanPeriodOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, domainOptionsQuery, payerPlanPeriodOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).costsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).costsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'cost_id', 'Cost'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'cost_id', 'Cost');
    const response = await container.resolve(OmopDbOmopApi).costsPutOne(id, { ...variables, cost_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).costsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    let fallbackValue: string | undefined;
    const revenueCodeConceptId = item.revenue_code_concept_id;
    if (typeof revenueCodeConceptId === 'string' && revenueCodeConceptId.length > 0) {
      const revenueCodeConceptIdOption = conceptOptionsQuery.options.find(candidate => candidate.value === revenueCodeConceptId);
      if (revenueCodeConceptIdOption?.label) {
        return revenueCodeConceptIdOption.label;
      }
      fallbackValue = revenueCodeConceptId;
    }
    const revenueCodeSourceValue = item.revenue_code_source_value;
    if (typeof revenueCodeSourceValue === 'string' && revenueCodeSourceValue.trim().length > 0) {
      return revenueCodeSourceValue;
    }
    if (typeof revenueCodeSourceValue === 'number') {
      return String(revenueCodeSourceValue);
    }
    const drgSourceValue = item.drg_source_value;
    if (typeof drgSourceValue === 'string' && drgSourceValue.trim().length > 0) {
      return drgSourceValue;
    }
    if (typeof drgSourceValue === 'number') {
      return String(drgSourceValue);
    }
    const costDomainId = item.cost_domain_id;
    if (typeof costDomainId === 'string' && costDomainId.length > 0) {
      const costDomainIdOption = domainOptionsQuery.options.find(candidate => candidate.value === costDomainId);
      if (costDomainIdOption?.label) {
        return costDomainIdOption.label;
      }
      if (!fallbackValue) {
        fallbackValue = costDomainId;
      }
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    /* v8 ignore else -- cost_domain_id is required on create, so a non-empty cost_domain_id always sets fallbackValue; rows return on their id first */
    if (fallbackValue) {
      return fallbackValue;
    }
    /* v8 ignore next -- unreachable, see the else ignore above */
    return t`New cost`;
  }, [conceptOptionsQuery.options, domainOptionsQuery.options, t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      amount_allowed: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      cost_domain_id: string().required(),
      cost_event_id: string().required(),
      cost_type_concept_id: string().required(),
      currency_concept_id: string().nullable().notRequired(),
      drg_concept_id: string().nullable().notRequired(),
      drg_source_value: string().nullable().notRequired(),
      paid_by_patient: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      paid_by_payer: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      paid_by_primary: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      paid_dispensing_fee: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      paid_ingredient_cost: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      paid_patient_coinsurance: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      paid_patient_copay: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      paid_patient_deductible: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      payer_plan_period_id: string().nullable().notRequired(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      revenue_code_concept_id: string().nullable().notRequired(),
      revenue_code_source_value: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      total_charge: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      total_cost: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
      total_paid: SchemaUtil.number.notRequired().transform((value: number, orig: number | string) => orig === '' ? undefined : value),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Cost Event ID`, name: 'cost_event_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Cost Domain ID`, loading: domainOptionsQuery.isLoading, name: 'cost_domain_id', options: domainOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Cost Type Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'cost_type_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Currency Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'currency_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Total Charge`, name: 'total_charge', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Total Cost`, name: 'total_cost', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Total Paid`, name: 'total_paid', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid By Payer`, name: 'paid_by_payer', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid By Patient`, name: 'paid_by_patient', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid Patient Copay`, name: 'paid_patient_copay', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid Patient Coinsurance`, name: 'paid_patient_coinsurance', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid Patient Deductible`, name: 'paid_patient_deductible', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid By Primary`, name: 'paid_by_primary', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid Ingredient Cost`, name: 'paid_ingredient_cost', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Paid Dispensing Fee`, name: 'paid_dispensing_fee', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Payer Plan Period ID`, loading: payerPlanPeriodOptionsQuery.isLoading, name: 'payer_plan_period_id', options: payerPlanPeriodOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Amount Allowed`, name: 'amount_allowed', type: 'number' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Revenue Code Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'revenue_code_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Revenue Code Source Value`, name: 'revenue_code_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`DRG Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'drg_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`DRG Source Value`, name: 'drg_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, domainOptionsQuery.isLoading, payerPlanPeriodOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, domainOptionsQuery.options, payerPlanPeriodOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createTextColumn<Row>({ id: 'cost_event_id', name: t`Cost Event ID` }),
      TableUtil.createOptionsColumn<Row>({ id: 'cost_domain_id', name: t`Cost Domain ID`, options: domainOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'cost_type_concept_id', name: t`Cost Type Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'currency_concept_id', name: t`Currency Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'total_charge', name: t`Total Charge` }),
      TableUtil.createNumberColumn<Row>({ id: 'total_cost', name: t`Total Cost` }),
      TableUtil.createNumberColumn<Row>({ id: 'total_paid', name: t`Total Paid` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_by_payer', name: t`Paid By Payer` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_by_patient', name: t`Paid By Patient` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_patient_copay', name: t`Paid Patient Copay` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_patient_coinsurance', name: t`Paid Patient Coinsurance` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_patient_deductible', name: t`Paid Patient Deductible` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_by_primary', name: t`Paid By Primary` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_ingredient_cost', name: t`Paid Ingredient Cost` }),
      TableUtil.createNumberColumn<Row>({ id: 'paid_dispensing_fee', name: t`Paid Dispensing Fee` }),
      TableUtil.createOptionsColumn<Row>({ id: 'payer_plan_period_id', name: t`Payer Plan Period ID`, options: payerPlanPeriodOptionsQuery.options }),
      TableUtil.createNumberColumn<Row>({ id: 'amount_allowed', name: t`Amount Allowed` }),
      TableUtil.createOptionsColumn<Row>({ id: 'revenue_code_concept_id', name: t`Revenue Code Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'revenue_code_source_value', name: t`Revenue Code Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'drg_concept_id', name: t`DRG Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'drg_source_value', name: t`DRG Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, domainOptionsQuery.options, payerPlanPeriodOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new cost`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.CostCrudCommand}
      defaultSortByField={'revenue_code_concept_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Cost`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.COSTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CostsAdminPage')}
      title={t`Costs`}
      updateOne={updateOne}
    />
  );
};
