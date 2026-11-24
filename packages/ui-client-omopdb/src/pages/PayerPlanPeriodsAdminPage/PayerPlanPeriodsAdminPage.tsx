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
  OmopDbPayerPlanPeriod,
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
import { useOrganizationOptionsQuery } from '@gen-epix/ui-client-common/dataHooks/useOrganizationsQuery';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';
import { useConceptOptionsQuery } from '../../dataHooks/useConceptQuery';
import { usePersonOptionsQuery } from '../../dataHooks/usePersonQuery';

type FormFields = OmitWithMetaData<OmopDbPayerPlanPeriod, 'payer_plan_period_id'>;
type Row = { id: string } & OmopDbPayerPlanPeriod;
const toTableRow = (item: OmopDbPayerPlanPeriod): Row => {
  return OmopDbAdminUtil.withId(item, 'payer_plan_period_id', 'Payer Plan Period');
};
export const PayerPlanPeriodsAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const conceptOptionsQuery = useConceptOptionsQuery();
  const personOptionsQuery = usePersonOptionsQuery();
  const loadables = useArray([organizationOptionsQuery, conceptOptionsQuery, personOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).payerPlanPeriodsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).payerPlanPeriodsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'payer_plan_period_id', 'Payer Plan Period'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'payer_plan_period_id', 'Payer Plan Period');
    const response = await container.resolve(OmopDbOmopApi).payerPlanPeriodsPutOne(id, { ...variables, payer_plan_period_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).payerPlanPeriodsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    const payerSourceValue = item.payer_source_value;
    if (typeof payerSourceValue === 'string' && payerSourceValue.trim().length > 0) {
      return payerSourceValue;
    }
    if (typeof payerSourceValue === 'number') {
      return String(payerSourceValue);
    }
    const planSourceValue = item.plan_source_value;
    if (typeof planSourceValue === 'string' && planSourceValue.trim().length > 0) {
      return planSourceValue;
    }
    if (typeof planSourceValue === 'number') {
      return String(planSourceValue);
    }
    const sponsorSourceValue = item.sponsor_source_value;
    if (typeof sponsorSourceValue === 'string' && sponsorSourceValue.trim().length > 0) {
      return sponsorSourceValue;
    }
    if (typeof sponsorSourceValue === 'number') {
      return String(sponsorSourceValue);
    }
    const familySourceValue = item.family_source_value;
    if (typeof familySourceValue === 'string' && familySourceValue.trim().length > 0) {
      return familySourceValue;
    }
    if (typeof familySourceValue === 'number') {
      return String(familySourceValue);
    }
    if ('id' in item && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    return t`New payer plan period`;
  }, [t]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      family_source_value: string().nullable().notRequired(),
      payer_concept_id: string().nullable().notRequired(),
      payer_plan_period_end_date: SchemaUtil.isoString.required(),
      payer_plan_period_start_date: SchemaUtil.isoString.required(),
      payer_source_concept_id: string().nullable().notRequired(),
      payer_source_value: string().nullable().notRequired(),
      person_id: string().required(),
      plan_concept_id: string().nullable().notRequired(),
      plan_source_concept_id: string().nullable().notRequired(),
      plan_source_value: string().nullable().notRequired(),
      provenance_id: string().nullable().notRequired(),
      provided_by_organization_id: string().nullable().notRequired(),
      source_traceback: string().nullable().notRequired(),
      sponsor_concept_id: string().nullable().notRequired(),
      sponsor_source_concept_id: string().nullable().notRequired(),
      sponsor_source_value: string().nullable().notRequired(),
      stop_reason_concept_id: string().nullable().notRequired(),
      stop_reason_source_concept_id: string().nullable().notRequired(),
      stop_reason_source_value: string().nullable().notRequired(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Provenance ID`, name: 'provenance_id' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Source Traceback`, name: 'source_traceback' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Person ID`, loading: personOptionsQuery.isLoading, name: 'person_id', options: personOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Payer Plan Period Start Date`, name: 'payer_plan_period_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Payer Plan Period End Date`, name: 'payer_plan_period_end_date' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Payer Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'payer_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Payer Source Value`, name: 'payer_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Payer Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'payer_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Plan Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'plan_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Plan Source Value`, name: 'plan_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Plan Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'plan_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Sponsor Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'sponsor_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Sponsor Source Value`, name: 'sponsor_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Sponsor Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'sponsor_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Family Source Value`, name: 'family_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Stop Reason Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'stop_reason_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Stop Reason Source Value`, name: 'stop_reason_source_value' } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Stop Reason Source Concept ID`, loading: conceptOptionsQuery.isLoading, name: 'stop_reason_source_concept_id', options: conceptOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Provided By Organization ID`, loading: organizationOptionsQuery.isLoading, name: 'provided_by_organization_id', options: organizationOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, conceptOptionsQuery.isLoading, personOptionsQuery.isLoading, organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createTextColumn<Row>({ id: 'provenance_id', name: t`Provenance ID` }),
      TableUtil.createTextColumn<Row>({ id: 'source_traceback', name: t`Source Traceback` }),
      TableUtil.createOptionsColumn<Row>({ id: 'person_id', name: t`Person ID`, options: personOptionsQuery.options }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'payer_plan_period_start_date', name: t`Payer Plan Period Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'payer_plan_period_end_date', name: t`Payer Plan Period End Date` }),
      TableUtil.createOptionsColumn<Row>({ id: 'payer_concept_id', name: t`Payer Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ advancedSort: true, id: 'payer_source_value', name: t`Payer Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'payer_source_concept_id', name: t`Payer Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'plan_concept_id', name: t`Plan Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'plan_source_value', name: t`Plan Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'plan_source_concept_id', name: t`Plan Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'sponsor_concept_id', name: t`Sponsor Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'sponsor_source_value', name: t`Sponsor Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'sponsor_source_concept_id', name: t`Sponsor Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'family_source_value', name: t`Family Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'stop_reason_concept_id', name: t`Stop Reason Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'stop_reason_source_value', name: t`Stop Reason Source Value` }),
      TableUtil.createOptionsColumn<Row>({ id: 'stop_reason_source_concept_id', name: t`Stop Reason Source Concept ID`, options: conceptOptionsQuery.options }),
      TableUtil.createOptionsColumn<Row>({ id: 'provided_by_organization_id', name: t`Provided By Organization ID`, options: organizationOptionsQuery.options }),
    ];
  }, [organizationOptionsQuery.options, conceptOptionsQuery.options, personOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new payer plan period`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.PayerPlanPeriodCrudCommand}
      defaultSortByField={'payer_source_value'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Payer Plan Period`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.PAYER_PLAN_PERIODS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('PayerPlanPeriodsAdminPage')}
      title={t`Payer Plan Periods`}
      updateOne={updateOne}
    />
  );
};
