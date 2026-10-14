import { container as rootContainer } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CommonDbOrganization } from '@gen-epix/api-commondb';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';

import { API_ORGANIZATION_TOKEN } from '../../models/api.models';
import type {
  UseMap,
  UseOptions,
} from '../../models/data-hooks.models';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';

export const useOrganizationsQuery = (): UseQueryResult<CommonDbOrganization[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(API_ORGANIZATION_TOKEN).organizationsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS),
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
