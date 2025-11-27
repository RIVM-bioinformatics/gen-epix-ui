import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  number,
  object,
  string,
} from 'yup';
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import type { RegionSet } from '../../api';
import {
  GeoApi,
  CommandName,
  PermissionType,
} from '../../api';
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

type FormFields = Pick<RegionSet, 'name' | 'code' | 'region_code_as_label' | 'resolution'>;

export const RegionSetsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.getInstance().regionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: RegionSet) => {
    return await GeoApi.getInstance().regionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RegionSet) => {
    return (await GeoApi.getInstance().regionSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.getInstance().regionSetsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: RegionSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      code: string().code().required().max(100),
      name: string().extendedAlphaNumeric().required().max(100),
      resolution: number().integer().positive().max(10000).required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      region_code_as_label: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'resolution',
        label: t`Resolution`,
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'region_code_as_label',
        label: t`Region code as label`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<RegionSet>[] => {
    return [
      TableUtil.createTextColumn<RegionSet>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<RegionSet>({ id: 'code', name: t`Code` }),
      TableUtil.createNumberColumn<RegionSet>({ id: 'resolution', name: t`Resolution` }),
      TableUtil.createBooleanColumn<RegionSet>({ id: 'region_code_as_label', name: t`Region code as label` }),
    ];
  }, [t]);

  const doesUserHavePermissionToViewRegions = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RegionCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const doesUserHavePermissionToViewRegionSetShapes = useMemo(() => {
    return AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RegionSetShapeCrudCommand, permission_type: PermissionType.READ },
    ]);
  }, []);

  const extraActionsFactory = useCallback((params: TableRowParams<RegionSet>) => {
    const items: ReactElement[] = [];
    if (doesUserHavePermissionToViewRegions) {
      items.push((
        <MenuItem
          key={'custom-action-1'}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={async () => await RouterManager.instance.router.navigate({
            pathname: `/management/region-sets/${params.row.id}/regions`,
          })}
        >
          <ListItemIcon />
          <ListItemText>
            {t`Manage regions`}
          </ListItemText>
        </MenuItem>
      ));
    }
    if (doesUserHavePermissionToViewRegionSetShapes) {
      items.push((
        <MenuItem
          key={'custom-action-1'}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={async () => await RouterManager.instance.router.navigate({
            pathname: `/management/region-sets/${params.row.id}/shapes`,
          })}
        >
          <ListItemIcon />
          <ListItemText>
            {t`Manage shapes`}
          </ListItemText>
        </MenuItem>
      ));
    }
    return items;
  }, [doesUserHavePermissionToViewRegionSetShapes, doesUserHavePermissionToViewRegions, t]);

  const editDialogExtraActionsFactory = useCallback((item: RegionSet): DialogAction[] => {
    const items: DialogAction[] = [];
    if (doesUserHavePermissionToViewRegionSetShapes) {
      items.push({
        ...TestIdUtil.createAttributes('RegionSetsAdminPage-ManageRegionsButton'),
        label: t`Manage regions`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/region-sets/${item.id}/regions`,
        }),
      });
    }
    if (doesUserHavePermissionToViewRegionSetShapes) {
      items.push({
        ...TestIdUtil.createAttributes('RegionSetsAdminPage-ManageShapesButton'),
        label: t`Manage shapes`,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: `/management/region-sets/${item.id}/shapes`,
        }),
      });
    }

    return items;
  }, [doesUserHavePermissionToViewRegionSetShapes, t]);

  return (
    <CrudPage<FormFields, RegionSet>
      createOne={createOne}
      crudCommandType={CommandName.RegionSetCrudCommand}
      createItemDialogTitle={t`Create new region set`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      extraActionsFactory={extraActionsFactory}
      editDialogExtraActionsFactory={editDialogExtraActionsFactory}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.REGION_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionSetsAdminPage')}
      title={t`Region sets`}
      updateOne={updateOne}
    />
  );
};
