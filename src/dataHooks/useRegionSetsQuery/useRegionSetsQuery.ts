import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { RegionSet } from '../../api';
import { GeoApi } from '../../api';
import type {
  UseOptions,
  UseMap,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useRegionSetsQuery = (): UseQueryResult<RegionSet[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS),
    queryFn: async ({ signal }) => {
      const response = await GeoApi.instance.regionSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useRegionSetOptionsQuery = (): UseOptions<string> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<RegionSet>(regionSetsQuery, item => item.id, item => item.name);
  }, [regionSetsQuery]);
};

export const useRegionSetsMapQuery = (): UseMap<RegionSet> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<RegionSet>(regionSetsQuery, item => item.id);
  }, [regionSetsQuery]);
};
