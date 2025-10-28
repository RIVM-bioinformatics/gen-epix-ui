import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Region } from '../../api';
import { GeoApi } from '../../api';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { useRegionSetsMapQuery } from '../useRegionSetsQuery';

export const useRegionQuery = (): UseQueryResult<Region[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REGIONS),
    queryFn: async ({ signal }) => {
      const response = await GeoApi.getInstance().regionsGetAll({ signal });
      return response.data;
    },
  });
};

export const useRegionMapQuery = (): UseMap<Region> => {
  const response = useRegionQuery();
  return useMemo(() => {
    return DataUtil.createUseMapDataHook<Region>(response, item => item.id);
  }, [response]);
};

export const useRegionNameFactory = (): UseNameFactory<Region> => {
  const regionSetsMapQuery = useRegionSetsMapQuery();

  return useMemo(() => {
    const getName = (item: Region) => {
      return `${regionSetsMapQuery.map.get(item.region_set_id)?.name ?? item.region_set_id} → ${item.name}`;
    };
    return DataUtil.createUseNameFactoryHook(getName, [regionSetsMapQuery]);
  }, [regionSetsMapQuery]);
};

export const useRegionOptionsQuery = (): UseOptions<string> => {
  const regionQuery = useRegionQuery();
  const regionMapQuery = useRegionNameFactory();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Region>(regionQuery, item => item.id, regionMapQuery.getName, [regionMapQuery]);
  }, [regionMapQuery, regionQuery]);
};
