import { container as rootContainer } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CommonDbOrganizationAdminPolicy } from '@gen-epix/api-commondb';

import { API_ABAC_TOKEN } from '../../constants/api.constants';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/data-hooks.models';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useOrganizationMapQuery } from '../useOrganizationsQuery';
import { useUsersMapQuery } from '../useUsersQuery';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';
import { UserUtil } from '../../utils/UserUtil';

export const useOrganizationAdminPoliciesQuery = (): UseQueryResult<CommonDbOrganizationAdminPolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(API_ABAC_TOKEN).organizationAdminPoliciesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: rootContainer.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.ORGANIZATION_ADMIN_POLICIES),
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
      return `${organizationMapQuery.map.get(item.organization_id)?.name ?? item.organization_id} -> ${UserUtil.getUserDisplayValue(usersMapQuery.map.get(item.user_id), t)}`;
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
