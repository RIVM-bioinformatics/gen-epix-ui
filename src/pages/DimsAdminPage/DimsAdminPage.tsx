import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  number,
  object,
  string,
} from 'yup';

import type { Dim } from '../../api';
import {
  CaseApi,
  DimType,
  CommandName,
} from '../../api';
import { useDimTypeOptionsQuery } from '../../dataHooks/useDimTypesQuery';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<Dim, 'dim_type' | 'code' | 'label' | 'description' | 'rank' | 'col_code_prefix'>;

export const DimsAdminPage = () => {
  const [t] = useTranslation();
  const dimTypeOptionsQuery = useDimTypeOptionsQuery();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.getInstance().dimsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Dim) => {
    return await CaseApi.getInstance().dimsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Dim) => {
    return (await CaseApi.getInstance().dimsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.getInstance().dimsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Dim) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      dim_type: mixed<DimType>().required().oneOf(Object.values(DimType)),
      code: string().code().required().max(100),
      label: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().required().max(100),
      rank: number().integer().positive().max(10000).optional().transform((val: number, orig) => orig === '' ? undefined : val),
      col_code_prefix: string().alphaNumeric().required().max(100),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'dim_type',
        label: t`Dimension type`,
        options: dimTypeOptionsQuery.options,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'label',
        label: t`Label`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'col_code_prefix',
        label: t`Column code prefix`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      },
    ];
  }, [dimTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<Dim>[] => {
    return [
      TableUtil.createTextColumn<Dim>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<Dim>({ id: 'dim_type', name: t`Dimension type`, options: dimTypeOptionsQuery.options }),
      TableUtil.createTextColumn<Dim>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<Dim>({ id: 'rank', name: t`Rank` }),
      TableUtil.createTextColumn<Dim>({ id: 'description', name: t`Description` }),
    ];
  }, [dimTypeOptionsQuery.options, t]);

  return (
    <CrudPage<FormFields, Dim>
      createOne={createOne}
      crudCommandType={CommandName.DimCrudCommand}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.DIMS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DimsAdminPage')}
      title={t`Dimensions`}
      updateOne={updateOne}
    />
  );
};
