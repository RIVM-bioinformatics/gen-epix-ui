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

export const useRegionSets = (): UseQueryResult<RegionSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REGION_SETS),
    queryFn: async ({ signal }) => {
      const response = await GeoApi.getInstance().regionSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useRegionSetOptions = (): UseOptions<string> => {
  const response = useRegionSets();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<RegionSet>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useRegionSetsMap = (): UseMap<RegionSet> => {
  const response = useRegionSets();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<RegionSet>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
