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
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import type { Dim } from '../../api';
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
import type {
  TableColumn,
  TableRowParams,
} from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { DialogAction } from '../../components/ui/Dialog';

type FormFields = Pick<Dim, 'dim_type' | 'code' | 'label' | 'description' | 'rank' | 'col_code_prefix'>;

export const DimsAdminPage = () => {
  const [t] = useTranslation();
  const dimTypeOptionsQuery = useDimTypeOptionsQuery();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.instance.dimsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Dim) => {
    return await CaseApi.instance.dimsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Dim) => {
    return (await CaseApi.instance.dimsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.instance.dimsPostOne(variables)).data;
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
      rank: number().integer().positive().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      col_code_prefix: string().alphaNumeric().required().max(100),
    });
  }, []);

  const formFieldDefinitions = useCallback((item: Dim): FormFieldDefinition<FormFields>[] => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'dim_type',
        label: t`Dimension type`,
        options: dimTypeOptionsQuery.options,
        disabled: Boolean(item),
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

  const tableColumns = useMemo((): TableColumn<Dim>[] => {
    return [
      TableUtil.createTextColumn<Dim>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<Dim>({ id: 'dim_type', name: t`Dimension type`, options: dimTypeOptionsQuery.options }),
      TableUtil.createTextColumn<Dim>({ id: 'label', name: t`Label` }),
      TableUtil.createNumberColumn<Dim>({ id: 'rank', name: t`Rank` }),
      TableUtil.createTextColumn<Dim>({ id: 'description', name: t`Description` }),
    ];
  }, [dimTypeOptionsQuery.options, t]);

  const doesUserHavePermissionToViewCols = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.ContactCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const extraActionsFactory = useCallback((params: TableRowParams<Dim>) => {
    if (!doesUserHavePermissionToViewCols) {
      return [];
    }

    return [(
      <MenuItem
        key={'custom-action-1'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={async () => await RouterManager.instance.router.navigate({
          pathname: `/management/dimensions/${params.row.id}/columns`,
        })}
      >
        <ListItemIcon />
        <ListItemText>
          {t`Manage columns`}
        </ListItemText>
      </MenuItem>
    )];
  }, [doesUserHavePermissionToViewCols, t]);


  const editDialogExtraActionsFactory = useCallback((item: Dim): DialogAction[] => {
    if (!doesUserHavePermissionToViewCols) {
      return [];
    }
    return [
      {
        ...TestIdUtil.createAttributes('DimsAdminPage-ManageColumnsButton'),
        label: t`Manage columns`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/dimensions/${item.id}/columns`,
        }),
      },
    ];
  }, [doesUserHavePermissionToViewCols, t]);

  return (
    <CrudPage<FormFields, Dim>
      createOne={createOne}
      crudCommandType={CommandName.DimCrudCommand}
      createItemDialogTitle={t`Create new dimension`}
      defaultSortByField={'code'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      editDialogExtraActionsFactory={editDialogExtraActionsFactory}
      extraActionsFactory={extraActionsFactory}
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
