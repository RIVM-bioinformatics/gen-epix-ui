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
import type { CommonDbOrganizationAdminPolicy } from '@gen-epix/api-commondb';
import { CommonDbCommandName } from '@gen-epix/api-commondb';

import { useOrganizationAdminPolicyNameFactory } from '../../dataHooks/useOrganizationAdminPoliciesQuery';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import { useUserOptionsQuery } from '../../dataHooks/useUsersQuery';
import { useArray } from '../../hooks/useArray';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type { TableColumn } from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { OmitWithMetaData } from '../../models/data';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { CrudPage } from '../CrudPage';

type FormFields = OmitWithMetaData<CommonDbOrganizationAdminPolicy, 'organization' | 'user'>;

export const OrganizationAdminPoliciesAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const userOptionsQuery = useUserOptionsQuery();
  const organizationAdminPolicyNameFactory = useOrganizationAdminPolicyNameFactory();

  const loadables = useArray([organizationOptionsQuery, userOptionsQuery, organizationAdminPolicyNameFactory]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await ConfigManager.getInstance().config.abacApi.organizationAdminPoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CommonDbOrganizationAdminPolicy) => {
    return await ConfigManager.getInstance().config.abacApi.organizationAdminPoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CommonDbOrganizationAdminPolicy) => {
    return (await ConfigManager.getInstance().config.abacApi.organizationAdminPoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await ConfigManager.getInstance().config.abacApi.organizationAdminPoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: CommonDbOrganizationAdminPolicy) => {
    return organizationAdminPolicyNameFactory.getName(item) ?? item.id;
  }, [organizationAdminPolicyNameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      is_active: boolean(),
      organization_id: string().required().uuid4(),
      user_id: string().required().uuid4(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Organization`,
        loading: organizationOptionsQuery.isLoading,
        name: 'organization_id',
        options: organizationOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`User`,
        loading: userOptionsQuery.isLoading,
        name: 'user_id',
        options: userOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        label: t`Active`,
        name: 'is_active',
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [organizationOptionsQuery.isLoading, organizationOptionsQuery.options, t, userOptionsQuery.isLoading, userOptionsQuery.options]);

  const tableColumns = useMemo((): TableColumn<CommonDbOrganizationAdminPolicy>[] => {
    return [
      TableUtil.createOptionsColumn<CommonDbOrganizationAdminPolicy>({ id: 'organization_id', name: t`Organization`, options: organizationOptionsQuery.options }),
      TableUtil.createOptionsColumn<CommonDbOrganizationAdminPolicy>({ id: 'user_id', name: t`User`, options: userOptionsQuery.options }),
      TableUtil.createBooleanColumn<CommonDbOrganizationAdminPolicy>({ id: 'is_active', name: t`Is active` }),
    ];
  }, [organizationOptionsQuery.options, t, userOptionsQuery.options]);

  return (
    <CrudPage<FormFields, CommonDbOrganizationAdminPolicy>
      createItemDialogTitle={t`Create new organization admin policy`}
      createOne={createOne}
      crudCommandType={CommonDbCommandName.OrganizationAdminPolicyCrudCommand}
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
