import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { CommonDbSite } from '@gen-epix/api-commondb';

import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import type { UseOptions } from '../../models/data-hooks.models';
import { DataHookUtil } from '../../utils/DataHookUtil';

export const useSitesQuery = (): ReturnType<typeof useQueryMemo<CommonDbSite[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(API_ORGANIZATION_TOKEN).sitesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.SITES),
  });
};

export const useSiteOptionsQuery = (): UseOptions<string> => {
  const sitesQuery = useSitesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbSite>(sitesQuery, site => site.id, site => site.name);
  }, [sitesQuery]);
};
