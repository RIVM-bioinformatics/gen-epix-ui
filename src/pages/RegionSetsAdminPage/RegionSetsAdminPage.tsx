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

import type { RegionSet } from '../../api';
import {
  GeoApi,
  CommandName,
  PermissionType,
} from '../../api';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { CrudPageSubPage } from '../CrudPage';
import { CrudPage } from '../CrudPage';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';

type FormFields = Pick<RegionSet, 'name' | 'code' | 'region_code_as_label' | 'resolution'>;

export const RegionSetsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.instance.regionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: RegionSet) => {
    return await GeoApi.instance.regionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: RegionSet) => {
    return (await GeoApi.instance.regionSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.instance.regionSetsPostOne(variables)).data;
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


  const subPages = useMemo<CrudPageSubPage<RegionSet>[]>(() => {
    const pages: CrudPageSubPage<RegionSet>[] = [];

    if (AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RegionCrudCommand, permission_type: PermissionType.READ },
    ])) {
      pages.push(
        {
          label: t`Manage regions`,
          getPathName: (item: RegionSet) => `/management/region-sets/${item.id}/regions`,
        } satisfies CrudPageSubPage<RegionSet>,
      );
    }

    if (AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RegionSetShapeCrudCommand, permission_type: PermissionType.READ },
    ])) {
      pages.push(
        {
          label: t`Manage shapes`,
          getPathName: (item: RegionSet) => `/management/region-sets/${item.id}/shapes`,
        } satisfies CrudPageSubPage<RegionSet>,
      );
    }
    return pages;
  }, [t]);


  return (
    <CrudPage<FormFields, RegionSet>
      createOne={createOne}
      crudCommandType={CommandName.RegionSetCrudCommand}
      createItemDialogTitle={t`Create new region set`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      subPages={subPages}
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
