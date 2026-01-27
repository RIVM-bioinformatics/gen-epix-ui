import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { OrganizationAdminPolicy } from '../../api';
import { AbacApi } from '../../api';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useOrganizationMapQuery } from '../useOrganizationsQuery';
import { useUsersMapQuery } from '../useUsersQuery';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';

export const useOrganizationAdminPoliciesQuery = (): UseQueryResult<OrganizationAdminPolicy[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_ADMIN_POLICIES),
    queryFn: async ({ signal }) => {
      const response = await AbacApi.instance.organizationAdminPoliciesGetAll({ signal });
      return response.data;
    },
  });
};

export const useOrganizationAdminPolicyMapQuery = (): UseMap<OrganizationAdminPolicy> => {
  const organizationAdminPoliciesQuery = useOrganizationAdminPoliciesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<OrganizationAdminPolicy>(organizationAdminPoliciesQuery, item => item.id);

  }, [organizationAdminPoliciesQuery]);
};

export const useOrganizationAdminPolicyNameFactory = (): UseNameFactory<OrganizationAdminPolicy> => {
  const [t] = useTranslation();

  const organizationMapQuery = useOrganizationMapQuery();
  const usersMapQuery = useUsersMapQuery();

  return useMemo(() => {
    const getName = (item: OrganizationAdminPolicy) => {
      return `${organizationMapQuery.map.get(item.organization_id)?.name ?? item.organization_id} → ${DataUtil.getUserDisplayValue(usersMapQuery.map.get(item.user_id), t)}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [organizationMapQuery, usersMapQuery]);
  }, [organizationMapQuery, t, usersMapQuery]);
};

export const useOrganizationAdminPolicyOptionsQuery = (): UseOptions<string> => {
  const organizationAdminPoliciesQuery = useOrganizationAdminPoliciesQuery();
  const organizationAdminPolicyNameFactory = useOrganizationAdminPolicyNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<OrganizationAdminPolicy>(organizationAdminPoliciesQuery, item => item.id, organizationAdminPolicyNameFactory.getName, [organizationAdminPolicyNameFactory]);
  }, [organizationAdminPolicyNameFactory, organizationAdminPoliciesQuery]);
};
