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
  ApiPermission,
  Outage,
} from '@gen-epix/api-casedb';
import {
  CommandName,
  PermissionType,
  SystemApi,
} from '@gen-epix/api-casedb';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { DATE_FORMAT } from '../../data/date';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

type FormFields = OmitWithMetaData<Outage>;

export const OutagesAdminPage = () => {
  const { t } = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await SystemApi.instance.outagesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Outage) => {
    return await SystemApi.instance.outagesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Outage) => {
    return (await SystemApi.instance.outagesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await SystemApi.instance.outagesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Outage) => {
    return item.description;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      active_from: SchemaUtil.isoString,
      active_to: SchemaUtil.isoString,
      description: SchemaUtil.description.required(),
      is_active: boolean(),
      is_visible: boolean(),
      visible_from: SchemaUtil.isoString,
      visible_to: SchemaUtil.isoString,
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        multiline: true,
        name: 'description',
        rows: 5,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        dateFormat: DATE_FORMAT.DATE_TIME,
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        label: t`Active from`,
        name: 'active_from',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        dateFormat: DATE_FORMAT.DATE_TIME,
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        label: t`Active to`,
        name: 'active_to',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        dateFormat: DATE_FORMAT.DATE_TIME,
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        label: t`Visible from`,
        name: 'visible_from',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        dateFormat: DATE_FORMAT.DATE_TIME,
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        label: t`Visible to`,
        name: 'visible_to',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Is active`,
        name: 'is_active',
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Is visible`,
        name: 'is_visible',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Outage>[] => {
    return [
      TableUtil.createDateColumn<Outage>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'active_from', name: t`Active from` }),
      TableUtil.createDateColumn<Outage>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'active_to', name: t`Active to` }),
      TableUtil.createDateColumn<Outage>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'visible_from', name: t`Visible from` }),
      TableUtil.createDateColumn<Outage>({ dateFormat: DATE_FORMAT.DATE_TIME, id: 'visible_to', name: t`Visible to` }),
      TableUtil.createBooleanColumn<Outage>({ id: 'is_active', name: t`Is active` }),
      TableUtil.createBooleanColumn<Outage>({ id: 'is_visible', name: t`Is visible` }),
    ];
  }, [t]);


  const extraCreateOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.OutageCrudCommand, permission_type: PermissionType.CREATE },
  ], []);
  const extraDeleteOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.OutageCrudCommand, permission_type: PermissionType.DELETE },
  ], []);
  const extraUpdateOnePermissions = useMemo<ApiPermission[]>(() => [
    { command_name: CommandName.OutageCrudCommand, permission_type: PermissionType.UPDATE },
  ], []);

  return (
    <CrudPage<FormFields, Outage>
      createItemDialogTitle={t`Create new outage`}
      createOne={createOne}
      crudCommandType={CommandName.OutageCrudCommand}
      defaultSortByField={'active_from'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      extraCreateOnePermissions={extraCreateOnePermissions}
      extraDeleteOnePermissions={extraDeleteOnePermissions}
      extraUpdateOnePermissions={extraUpdateOnePermissions}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.OUTAGES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OutagesAdminPage')}
      title={t`Outages`}
      updateOne={updateOne}
    />
  );
};
