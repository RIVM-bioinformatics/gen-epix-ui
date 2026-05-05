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
import type { CaseDbRefDim } from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbCommandName,
  CaseDbDimType,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';

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
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<CaseDbRefDim, 'props'>;

export const RefDimsAdminPage = () => {
  const { t } = useTranslation();
  const dimTypeOptionsQuery = useDimTypeOptionsQuery();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbCaseApi.getInstance().refDimsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbRefDim) => {
    return await CaseDbCaseApi.getInstance().refDimsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbRefDim) => {
    return (await CaseDbCaseApi.getInstance().refDimsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbCaseApi.getInstance().refDimsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbRefDim) => {
    return item.label;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: SchemaUtil.code,
      col_code_prefix: string().alphaNumeric().required().max(100),
      description: SchemaUtil.description,
      dim_type: mixed<CaseDbDimType>().required().oneOf(Object.values(CaseDbDimType)),
      label: SchemaUtil.label,
      rank: SchemaUtil.rank,
    });
  }, []);

  const formFieldDefinitions = useCallback((item: CaseDbRefDim): FormFieldDefinition<FormFields>[] => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !!item,
        label: t`Dimension type`,
        name: 'dim_type',
        options: dimTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Label`,
        name: 'label',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Column code prefix`,
        name: 'col_code_prefix',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Rank`,
        name: 'rank',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [dimTypeOptionsQuery.options, t]);

  const tableColumns = useMemo((): TableColumn<CaseDbRefDim>[] => {
    return [
      TableUtil.createTextColumn<CaseDbRefDim>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<CaseDbRefDim>({ id: 'dim_type', name: t`Dimension type`, options: dimTypeOptionsQuery.options }),
      TableUtil.createTextColumn<CaseDbRefDim>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<CaseDbRefDim>({ id: 'rank', name: t`Rank` }),
    ];
  }, [dimTypeOptionsQuery.options, t]);

  const subPages = useMemo<CrudPageSubPage<CaseDbRefDim>[]>(() => {
    if (!AuthorizationManager.getInstance().doesUserHavePermission([
      { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        getPathName: (item: CaseDbRefDim) => `/management/reference-dimensions/${item.id}/reference-columns`,
        label: t`Manage reference columns`,
      } satisfies CrudPageSubPage<CaseDbRefDim>,
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseDbRefDim>
      createItemDialogTitle={t`Create new reference dimension`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.RefDimCrudCommand}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.REF_DIMS}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RefDimsAdminPage')}
      title={t`Dimensions`}
      updateOne={updateOne}
    />
  );
};
