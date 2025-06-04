import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
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
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useOrganizationMap } from '../useOrganizations';
import { useUsersMap } from '../useUsers';

export const useOrganizationAdminPolicies = (): UseQueryResult<OrganizationAdminPolicy[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_ADMIN_POLICIES),
    queryFn: async ({ signal }) => {
      const response = await AbacApi.getInstance().organizationAdminPoliciesGetAll({ signal });
      return response.data;
    },
  });
};

export const useOrganizationAdminPolicyMap = (): UseMap<OrganizationAdminPolicy> => {
  const response = useOrganizationAdminPolicies();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<OrganizationAdminPolicy>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useOrganizationAdminPolicyNameFactory = (): UseNameFactory<OrganizationAdminPolicy> => {
  const [t] = useTranslation();

  const organizationsMap = useOrganizationMap();
  const usersMap = useUsersMap();

  return useMemo(() => {
    const getName = (item: OrganizationAdminPolicy) => {
      return `${organizationsMap.map.get(item.organization_id)?.name ?? item.organization_id} → ${DataUtil.getUserDisplayValue(usersMap.map.get(item.user_id), t)}`;
    };
    return DataUtil.createUseNameFactoryHook(getName, [organizationsMap, usersMap]);
  }, [organizationsMap, t, usersMap]);
};

export const useOrganizationAdminPolicyOptions = (): UseOptions<string> => {
  const response = useOrganizationAdminPolicies();

  const organizationAdminPolicyNameFactory = useOrganizationAdminPolicyNameFactory();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<OrganizationAdminPolicy>(response, item => item.id, organizationAdminPolicyNameFactory.getName, [organizationAdminPolicyNameFactory]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationAdminPolicyNameFactory, DataUtil.createMemorizationDependency(response)]);
};
