import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  object,
  string,
} from 'yup';

import type { OrganizationAdminPolicy } from '../../api';
import {
  AbacApi,
  CommandName,
} from '../../api';
import { useOrganizationAdminPolicyNameFactory } from '../../dataHooks/useOrganizationAdminPoliciesQuery';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import { useUserOptionsQuery } from '../../dataHooks/useUsersQuery';
import type { Loadable } from '../../models/dataHooks';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';

type FormFields = Pick<OrganizationAdminPolicy, 'is_active' | 'organization_id' | 'user_id'>;

export const OrganizationAdminPoliciesAdminPage = () => {
  const [t] = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const userOptionsQuery = useUserOptionsQuery();
  const organizationAdminPolicyNameFactory = useOrganizationAdminPolicyNameFactory();

  const loadables = useMemo<Loadable[]>(() => [organizationOptionsQuery, userOptionsQuery, organizationAdminPolicyNameFactory], [organizationOptionsQuery, userOptionsQuery, organizationAdminPolicyNameFactory]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.getInstance().organizationAdminPoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: OrganizationAdminPolicy) => {
    return await AbacApi.getInstance().organizationAdminPoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: OrganizationAdminPolicy) => {
    return (await AbacApi.getInstance().organizationAdminPoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.getInstance().organizationAdminPoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: OrganizationAdminPolicy) => {
    return organizationAdminPolicyNameFactory.getName(item) ?? item.id;
  }, [organizationAdminPolicyNameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      is_active: boolean(),
      organization_id: string().uuid4().nullable().max(100),
      user_id: string().uuid4().nullable().max(100),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'organization_id',
        label: t`Organization`,
        options: organizationOptionsQuery.options,
        loading: organizationOptionsQuery.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'user_id',
        label: t`User`,
        options: userOptionsQuery.options,
        loading: userOptionsQuery.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Active`,
      },
    ];
  }, [organizationOptionsQuery.isLoading, organizationOptionsQuery.options, t, userOptionsQuery.isLoading, userOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<OrganizationAdminPolicy>[] => {
    return [
      TableUtil.createOptionsColumn<OrganizationAdminPolicy>({ id: 'organization_id', name: t`Organization`, options: organizationOptionsQuery.options }),
      TableUtil.createOptionsColumn<OrganizationAdminPolicy>({ id: 'user_id', name: t`User`, options: userOptionsQuery.options }),
      TableUtil.createBooleanColumn<OrganizationAdminPolicy>({ id: 'is_active', name: t`Is active` }),
    ];
  }, [organizationOptionsQuery.options, t, userOptionsQuery.options]);

  return (
    <CrudPage<FormFields, OrganizationAdminPolicy>
      createOne={createOne}
      crudCommandType={CommandName.OrganizationAdminPolicyCrudCommand}
      defaultSortByField={'organization_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATION_ADMIN_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationAdminPoliciesAdminPage')}
      title={t`Organization admin policies`}
      updateOne={updateOne}
    />
  );
};
