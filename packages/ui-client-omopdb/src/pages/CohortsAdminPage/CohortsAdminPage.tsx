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
  OmopDbCohort,
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
import { useCohortDefinitionOptionsQuery } from '../../dataHooks/useCohortDefinitionQuery';

type FormFields = OmitWithMetaData<OmopDbCohort, 'cohort_id'>;
type Row = { id: string } & OmopDbCohort;
const toTableRow = (item: OmopDbCohort): Row => {
  return OmopDbAdminUtil.withId(item, 'cohort_id', 'Cohort');
};
export const CohortsAdminPage = () => {
  const { t } = useTranslation();
  const cohortDefinitionOptionsQuery = useCohortDefinitionOptionsQuery();
  const loadables = useArray([cohortDefinitionOptionsQuery]);
  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const response = await container.resolve(OmopDbOmopApi).cohortsGetAll(null, null, { signal });
    return response.data.map(toTableRow);
  }, []);
  const deleteOne = useCallback(async (item: Row) => {
    return await container.resolve(OmopDbOmopApi).cohortsDeleteOne(OmopDbAdminUtil.getPrimaryKey(item, 'cohort_id', 'Cohort'));
  }, []);
  const updateOne = useCallback(async (variables: FormFields, item: Row) => {
    const id = OmopDbAdminUtil.getPrimaryKey(item, 'cohort_id', 'Cohort');
    const response = await container.resolve(OmopDbOmopApi).cohortsPutOne(id, { ...variables, cohort_id: id });
    return toTableRow(response.data);
  }, []);
  const createOne = useCallback(async (variables: FormFields) => {
    const response = await container.resolve(OmopDbOmopApi).cohortsPostOne(variables);
    return toTableRow(response.data);
  }, []);
  const getName = useCallback((item: FormFields | Row) => {
    const cohortDefinitionIdOption = cohortDefinitionOptionsQuery.options.find(candidate => candidate.value === item.cohort_definition_id);
    if (cohortDefinitionIdOption?.label) {
      return cohortDefinitionIdOption.label;
    }
    if (item.subject_id.trim().length > 0) {
      return item.subject_id;
    }
    return 'id' in item ? item.id : item.cohort_definition_id;
  }, [cohortDefinitionOptionsQuery.options]);
  const schema = useMemo(() => {
    return object<FormFields>().shape({
      cohort_definition_id: string().required(),
      cohort_end_date: SchemaUtil.isoString.required(),
      cohort_start_date: SchemaUtil.isoString.required(),
      subject_id: string().required(),
    });
  }, []);
  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, label: t`Cohort Definition ID`, loading: cohortDefinitionOptionsQuery.isLoading, name: 'cohort_definition_id', options: cohortDefinitionOptionsQuery.options } as const satisfies FormFieldDefinition<FormFields>,
      { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, label: t`Subject ID`, name: 'subject_id' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Cohort Start Date`, name: 'cohort_start_date' } as const satisfies FormFieldDefinition<FormFields>,
      { dateFormat: DATE_FORMAT.DATE, definition: FORM_FIELD_DEFINITION_TYPE.DATE, label: t`Cohort End Date`, name: 'cohort_end_date' } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [cohortDefinitionOptionsQuery.isLoading, cohortDefinitionOptionsQuery.options, t]);
  const tableColumns = useMemo((): TableColumn<Row>[] => {
    return [
      TableUtil.createOptionsColumn<Row>({ id: 'cohort_definition_id', name: t`Cohort Definition ID`, options: cohortDefinitionOptionsQuery.options }),
      TableUtil.createTextColumn<Row>({ id: 'subject_id', name: t`Subject ID` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'cohort_start_date', name: t`Cohort Start Date` }),
      TableUtil.createDateColumn<Row>({ dateFormat: DATE_FORMAT.DATE, id: 'cohort_end_date', name: t`Cohort End Date` }),
    ];
  }, [cohortDefinitionOptionsQuery.options, t]);
  return (
    <CrudPage<FormFields, Row, Row, OMOPDB_QUERY_KEY, OmopDbApiPermission>
      createItemDialogTitle={t`Create new cohort`}
      createOne={createOne}
      crudCommandType={OmopDbCommandName.CohortCrudCommand}
      defaultSortByField={'cohort_definition_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      itemName={t`Cohort`}
      loadables={loadables}
      resourceQueryKeyBase={OMOPDB_QUERY_KEY.COHORTS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CohortsAdminPage')}
      title={t`Cohorts`}
      updateOne={updateOne}
    />
  );
};
