import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  object,
} from 'yup';
import type {
  CaseDbApiPermission,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbGeoApi,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type {
  CrudPageSubPage,
  FormFieldDefinition,
  OmitWithMetaData,
  TableColumn,
} from '@gen-epix/ui';
import {
  AuthorizationManager,
  CrudPage,
  FORM_FIELD_DEFINITION_TYPE,
  SchemaUtil,
  TableUtil,
  TestIdUtil,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


type FormFields = OmitWithMetaData<CaseDbRegionSet>;

export const RegionSetsAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseDbGeoApi.getInstance().regionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseDbRegionSet) => {
    return await CaseDbGeoApi.getInstance().regionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseDbRegionSet) => {
    return (await CaseDbGeoApi.getInstance().regionSetsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseDbGeoApi.getInstance().regionSetsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CaseDbRegionSet) => {
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

  const tableColumns = useMemo((): TableColumn<CaseDbRegionSet>[] => {
    return [
      TableUtil.createTextColumn<CaseDbRegionSet>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<CaseDbRegionSet>({ id: 'code', name: t`Code` }),
      TableUtil.createNumberColumn<CaseDbRegionSet>({ id: 'resolution', name: t`Resolution` }),
      TableUtil.createBooleanColumn<CaseDbRegionSet>({ id: 'region_code_as_label', name: t`Region code as label` }),
    ];
  }, [t]);


  const subPages = useMemo<CrudPageSubPage<CaseDbRegionSet>[]>(() => {
    const pages: CrudPageSubPage<CaseDbRegionSet>[] = [];

    if (AuthorizationManager.getInstance().doesUserHavePermission<CaseDbApiPermission>([
      { command_name: CaseDbCommandName.RegionCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      pages.push(
        {
          getPathName: (item: CaseDbRegionSet) => `/management/region-sets/${item.id}/regions`,
          label: t`Manage regions`,
        } satisfies CrudPageSubPage<CaseDbRegionSet>,
      );
    }

    if (AuthorizationManager.getInstance().doesUserHavePermission<CaseDbApiPermission>([
      { command_name: CaseDbCommandName.RegionSetShapeCrudCommand, permission_type: CaseDbPermissionType.READ },
    ])) {
      pages.push(
        {
          getPathName: (item: CaseDbRegionSet) => `/management/region-sets/${item.id}/shapes`,
          label: t`Manage shapes`,
        } satisfies CrudPageSubPage<CaseDbRegionSet>,
      );
    }
    return pages;
  }, [t]);


  return (
    <CrudPage<FormFields, CaseDbRegionSet>
      createItemDialogTitle={t`Create new region set`}
      createOne={createOne}
      crudCommandType={CaseDbCommandName.RegionSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={CASEDB_QUERY_KEY.REGION_SETS}
      schema={schema}
      subPages={subPages}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionSetsAdminPage')}
      title={t`Region sets`}
      updateOne={updateOne}
    />
  );
};
