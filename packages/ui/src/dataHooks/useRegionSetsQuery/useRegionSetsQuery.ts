import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { RegionSet } from '@gen-epix/api-casedb';
import { GeoApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useRegionSetsQuery = (): UseQueryResult<RegionSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await GeoApi.instance.regionSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS),
  });
};

export const useRegionSetOptionsQuery = (): UseOptions<string> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<RegionSet>(regionSetsQuery, item => item.id, item => item.name);
  }, [regionSetsQuery]);
};

export const useRegionSetsMapQuery = (): UseMap<RegionSet> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<RegionSet>(regionSetsQuery, item => item.id);
  }, [regionSetsQuery]);
};
