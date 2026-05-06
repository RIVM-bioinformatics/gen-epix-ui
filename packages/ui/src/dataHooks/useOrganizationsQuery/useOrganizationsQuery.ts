import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CommonDbOrganization } from '@gen-epix/api-commondb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { StringUtil } from '../../utils/StringUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../data/query';

export const useOrganizationsQuery = (): UseQueryResult<CommonDbOrganization[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ConfigManager.getInstance().config.organizationApi.organizationsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS),
  });
};

export const useOrganizationMapQuery = (): UseMap<CommonDbOrganization> => {
  const organizationsQuery = useOrganizationsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CommonDbOrganization>(organizationsQuery, item => item.id);
  }, [organizationsQuery]);
};

export const useOrganizationOptionsQuery = (): UseOptions<string> => {
  const organizationsQuery = useOrganizationsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbOrganization>(organizationsQuery, item => item.id, item => item.name, [], (a, b) => StringUtil.advancedSortComperator(a.name, b.name));
  }, [organizationsQuery]);
};
