import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
  string,
} from 'yup';

import type { RefDim } from '../../api';
import {
  CaseApi,
  DimType,
  CommandName,
  PermissionType,
} from '../../api';
import { useDimTypeOptionsQuery } from '../../dataHooks/useDimTypesQuery';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { NumberUtil } from '../../utils/NumberUtil';
import type { OmitWithMetaData } from '../../models/data';

type FormFields = OmitWithMetaData<RefDim, 'props'>;

export const RefDimsAdminPage = () => {
  const { t } = useTranslation();
  const dimTypeOptionsQuery = useDimTypeOptionsQuery();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.refDimsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: RefDim) => {
    return await CaseApi.instance.refDimsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RefDim) => {
    return (await CaseApi.instance.refDimsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.refDimsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: RefDim) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      dim_type: mixed<DimType>().required().oneOf(Object.values(DimType)),
      code: string().code().required().max(100),
      label: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().required().max(100),
      rank: NumberUtil.yup.required().min(0).integer(),
      col_code_prefix: string().alphaNumeric().required().max(100),
    });
  }, []);

  const formFieldDefinitions = useCallback((item: RefDim): FormFieldDefinition<FormFields>[] => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'dim_type',
        label: t`Dimension type`,
        options: dimTypeOptionsQuery.options,
        disabled: !!item,
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
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'col_code_prefix',
        label: t`Column code prefix`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'rank',
        label: t`Rank`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [dimTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<RefDim>[] => {
    return [
      TableUtil.createTextColumn<RefDim>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<RefDim>({ id: 'dim_type', name: t`Dimension type`, options: dimTypeOptionsQuery.options }),
      TableUtil.createTextColumn<RefDim>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<RefDim>({ id: 'rank', name: t`Rank` }),
    ];
  }, [dimTypeOptionsQuery.options, t]);

  const subPages = useMemo<CrudPageSubPage<RefDim>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        label: t`Manage reference columns`,
        getPathName: (item: RefDim) => `/management/reference-dimensions/${item.id}/reference-columns`,
      } satisfies CrudPageSubPage<RefDim>,
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, RefDim>
      createOne={createOne}
      crudCommandType={CommandName.RefDimCrudCommand}
      createItemDialogTitle={t`Create new reference dimension`}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      subPages={subPages}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.REF_DIMS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RefDimsAdminPage')}
      title={t`Dimensions`}
      updateOne={updateOne}
    />
  );
};
