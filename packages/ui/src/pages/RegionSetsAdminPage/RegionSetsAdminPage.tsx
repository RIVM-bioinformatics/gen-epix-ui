import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  object,
} from 'yup';
import type { RegionSet } from '@gen-epix/api-casedb';
import {
  CommandName,
  GeoApi,
  PermissionType,
} from '@gen-epix/api-casedb';

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

type FormFields = OmitWithMetaData<RegionSet>;

export const RegionSetsAdminPage = () => {
  const { t } = useTranslation();

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
      code: SchemaUtil.code,
      name: SchemaUtil.name,
      region_code_as_label: boolean().required(),
      resolution: SchemaUtil.number.integer().positive().max(10000).required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Name`,
        name: 'name',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Code`,
        name: 'code',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Resolution`,
        name: 'resolution',
        type: 'number',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Region code as label`,
        name: 'region_code_as_label',
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
          getPathName: (item: RegionSet) => `/management/region-sets/${item.id}/regions`,
          label: t`Manage regions`,
        } satisfies CrudPageSubPage<RegionSet>,
      );
    }

    if (AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.RegionSetShapeCrudCommand, permission_type: PermissionType.READ },
    ])) {
      pages.push(
        {
          getPathName: (item: RegionSet) => `/management/region-sets/${item.id}/shapes`,
          label: t`Manage shapes`,
        } satisfies CrudPageSubPage<RegionSet>,
      );
    }
    return pages;
  }, [t]);


  return (
    <CrudPage<FormFields, RegionSet>
      createItemDialogTitle={t`Create new region set`}
      createOne={createOne}
      crudCommandType={CommandName.RegionSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.REGION_SETS}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionSetsAdminPage')}
      title={t`Region sets`}
      updateOne={updateOne}
    />
  );
};
