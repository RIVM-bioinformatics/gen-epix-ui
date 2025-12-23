import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { Organization } from '../../api';
import {
  OrganizationApi,
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

type FormFields = Pick<Organization, 'name' | 'legal_entity_code'>;

export const OrganizationsAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.instance.organizationsGetAll({ signal }))?.data;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Organization) => {
    return (await OrganizationApi.instance.organizationsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.instance.organizationsPostOne(variables)).data;
  }, []);

  const deleteOne = useCallback(async (item: Organization) => {
    return await OrganizationApi.instance.organizationsDeleteOne(item.id);
  }, []);

  const getName = useCallback((item: Organization) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      legal_entity_code: string().extendedAlphaNumeric().required().max(100),
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
        name: 'legal_entity_code',
        label: t`Legal entity code`,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Organization>[] => {
    return [
      TableUtil.createTextColumn<Organization>({ id: 'name', name: t`Name`, advancedSort: true }),
      TableUtil.createTextColumn<Organization>({ id: 'legal_entity_code', name: t`Legal entity code` }),
    ];
  }, [t]);

  const subPages = useMemo<CrudPageSubPage<Organization>[]>(() => {
    if (!AuthorizationManager.instance.doesUserHavePermission([
      { command_name: CommandName.SiteCrudCommand, permission_type: PermissionType.READ },
    ])) {
      return [];
    }

    return [
      {
        label: t`Manage sites`,
        getPathName: (item: Organization) => `/management/organizations/${item.id}/sites`,
      } satisfies CrudPageSubPage<Organization>,
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, Organization>
      createOne={createOne}
      crudCommandType={CommandName.OrganizationCrudCommand}
      createItemDialogTitle={t`Create new organization`}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      subPages={subPages}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationsAdminPage')}
      title={t`Organizations`}
      updateOne={updateOne}
    />
  );
};
