import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
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

export const useRegionSetsQuery = (): UseQueryResult<RegionSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS),
    queryFn: async ({ signal }) => {
      const response = await GeoApi.getInstance().regionSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useRegionSetOptionsQuery = (): UseOptions<string> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<RegionSet>(regionSetsQuery, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(regionSetsQuery)]);
};

export const useRegionSetsMapQuery = (): UseMap<RegionSet> => {
  const regionSetsQuery = useRegionSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<RegionSet>(regionSetsQuery, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(regionSetsQuery)]);
};
