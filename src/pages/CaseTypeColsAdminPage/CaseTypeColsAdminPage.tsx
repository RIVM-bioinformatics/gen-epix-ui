import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  number,
  object,
  string,
} from 'yup';
import { isValid } from 'date-fns';

import type { CaseTypeCol } from '../../api';
import {
  CaseApi,
  CommandName,
} from '../../api';
import { useCaseTypeColOptionsQuery } from '../../dataHooks/useCaseTypeColsQuery';
import { useCaseTypeOptionsQuery } from '../../dataHooks/useCaseTypesQuery';
import { useColOptionsQuery } from '../../dataHooks/useColsQuery';
import { useTreeAlgorithmCodeOptionsQuery } from '../../dataHooks/useTreeAlgorithmCodesQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { DATE_FORMAT } from '../../data/date';

type FormFields = Pick<CaseTypeCol, 'case_type_id' | 'col_id' | 'case_type_dim_id' | 'code' | 'rank' | 'label' | 'description' | 'min_value' | 'max_value' | 'min_datetime' | 'max_datetime' | 'min_length' | 'genetic_sequence_case_type_col_id' | 'tree_algorithm_codes' | 'pattern'>;

export const CaseTypeColsAdminPage = () => {
  const [t] = useTranslation();
  const colOptionsQuery = useColOptionsQuery();
  const treeAlgorithmCodesOptionsQuery = useTreeAlgorithmCodeOptionsQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseTypeColOptionsQuery = useCaseTypeColOptionsQuery();

  const loadables = useArray([caseTypeOptionsQuery, colOptionsQuery, treeAlgorithmCodesOptionsQuery, caseTypeColOptionsQuery]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.caseTypeColsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseTypeCol) => {
    return await CaseApi.instance.caseTypeColsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeCol) => {
    return (await CaseApi.instance.caseTypeColsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.caseTypeColsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseTypeCol) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      label: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      rank: number().integer().positive().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      col_id: string().uuid4().required().max(100),
      case_type_dim_id: string().uuid4().required().max(100),
      case_type_id: string().uuid4().required().max(100),
      description: string().freeFormText().required().max(100),
      min_value: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      max_value: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      min_datetime: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      max_datetime: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      min_length: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      max_length: number().integer().positive().max(10000).optional().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      genetic_sequence_case_type_col_id: string().uuid4().transform((_val: unknown, orig: string) => orig === null || undefined ? undefined : orig),
      tree_algorithm_codes: array(),
      pattern: string().freeFormText(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_id',
        label: t`Case type`,
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'label',
        label: t`Label`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'col_id',
        label: t`Column`,
        options: colOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'min_value',
        label: t`Min value`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'max_value',
        label: t`Max value`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'min_datetime',
        label: t`Min datetime`,
        dateFormat: DATE_FORMAT.DATE_TIME,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'max_datetime',
        label: t`Max datetime`,
        dateFormat: DATE_FORMAT.DATE_TIME,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'min_length',
        label: t`Min value`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'genetic_sequence_case_type_col_id',
        label: t`Genetic sequence case type column`,
        options: caseTypeColOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'tree_algorithm_codes',
        label: t`Tree algorithm codes`,
        options: treeAlgorithmCodesOptionsQuery.options,
        multiple: true,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseTypeColOptionsQuery.options, caseTypeOptionsQuery.options, colOptionsQuery.options, t, treeAlgorithmCodesOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<CaseTypeCol>[] => {
    return [
      TableUtil.createOptionsColumn<CaseTypeCol>({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options }),
      TableUtil.createOptionsColumn<CaseTypeCol>({ id: 'col_id', name: t`Column`, options: colOptionsQuery.options }),
      TableUtil.createTextColumn<CaseTypeCol>({ id: 'code', name: t`Code` }),
      TableUtil.createNumberColumn<CaseTypeCol>({ id: 'rank', name: t`Rank` }),
    ];
  }, [caseTypeOptionsQuery.options, colOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, CaseTypeCol>
      createOne={createOne}
      crudCommandType={CommandName.CaseTypeColCrudCommand}
      createItemDialogTitle={t`Create new case type column`}
      defaultSortByField={'case_type_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPE_COLS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeColsAdminPage')}
      title={t`Case type columns`}
      updateOne={updateOne}
    />
  );
};
