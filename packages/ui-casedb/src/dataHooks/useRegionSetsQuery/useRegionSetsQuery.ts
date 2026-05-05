import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRegionSet } from '@gen-epix/api-casedb';
import { CaseDbGeoApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';

export const useRegionSetsQuery = (): UseQueryResult<CaseDbRegionSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbGeoApi.getInstance().regionSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.REGION_SETS),
  });
};

export const useRegionSetOptionsQuery = (): UseOptions<string> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbRegionSet>(regionSetsQuery, item => item.id, item => item.name);
  }, [regionSetsQuery]);
};

export const useRegionSetsMapQuery = (): UseMap<CaseDbRegionSet> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbRegionSet>(regionSetsQuery, item => item.id);
  }, [regionSetsQuery]);
};
