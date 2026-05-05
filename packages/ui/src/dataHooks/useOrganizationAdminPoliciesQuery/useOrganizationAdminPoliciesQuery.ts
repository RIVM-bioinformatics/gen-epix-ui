import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CommonDbOrganizationAdminPolicy } from '@gen-epix/api-commondb';

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
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { DataUtil } from '../../utils/DataUtil';

export const useOrganizationAdminPoliciesQuery = (): UseQueryResult<CommonDbOrganizationAdminPolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ConfigManager.getInstance().config.abacApi.organizationAdminPoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_ADMIN_POLICIES),
  });
};

export const useOrganizationAdminPolicyMapQuery = (): UseMap<CommonDbOrganizationAdminPolicy> => {
  const organizationAdminPoliciesQuery = useOrganizationAdminPoliciesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CommonDbOrganizationAdminPolicy>(organizationAdminPoliciesQuery, item => item.id);

  }, [organizationAdminPoliciesQuery]);
};

export const useOrganizationAdminPolicyNameFactory = (): UseNameFactory<CommonDbOrganizationAdminPolicy> => {
  const { t } = useTranslation();

  const organizationMapQuery = useOrganizationMapQuery();
  const usersMapQuery = useUsersMapQuery();

  return useMemo(() => {
    const getName = (item: CommonDbOrganizationAdminPolicy) => {
      return `${organizationMapQuery.map.get(item.organization_id)?.name ?? item.organization_id} → ${DataUtil.getUserDisplayValue(usersMapQuery.map.get(item.user_id), t)}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [organizationMapQuery, usersMapQuery]);
  }, [organizationMapQuery, t, usersMapQuery]);
};

export const useOrganizationAdminPolicyOptionsQuery = (): UseOptions<string> => {
  const organizationAdminPoliciesQuery = useOrganizationAdminPoliciesQuery();
  const organizationAdminPolicyNameFactory = useOrganizationAdminPolicyNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbOrganizationAdminPolicy>(organizationAdminPoliciesQuery, item => item.id, organizationAdminPolicyNameFactory.getName, [organizationAdminPolicyNameFactory]);
  }, [organizationAdminPolicyNameFactory, organizationAdminPoliciesQuery]);
};
