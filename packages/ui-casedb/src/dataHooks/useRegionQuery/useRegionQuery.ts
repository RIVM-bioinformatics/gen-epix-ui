import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRegion } from '@gen-epix/api-casedb';
import { CaseDbGeoApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QueryKeyManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { useRegionSetsMapQuery } from '../useRegionSetsQuery';
import { CASEDB_QUERY_KEY } from '../../data/query';


export const useRegionQuery = (): UseQueryResult<CaseDbRegion[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbGeoApi.getInstance().regionsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryKeyManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGIONS),
  });
};

export const useRegionMapQuery = (): UseMap<CaseDbRegion> => {
  const response = useRegionQuery();
  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbRegion>(response, item => item.id);
  }, [response]);
};

export const useRegionNameFactory = (): UseNameFactory<CaseDbRegion> => {
  const regionSetsMapQuery = useRegionSetsMapQuery();

  return useMemo(() => {
    const getName = (item: CaseDbRegion) => {
      return `${regionSetsMapQuery.map.get(item.region_set_id)?.name ?? item.region_set_id} → ${item.name}`;
    };
    return DataHookUtil.createUseNameFactoryHook(getName, [regionSetsMapQuery]);
  }, [regionSetsMapQuery]);
};

export const useRegionOptionsQuery = (): UseOptions<string> => {
  const regionQuery = useRegionQuery();
  const regionMapQuery = useRegionNameFactory();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbRegion>(regionQuery, item => item.id, regionMapQuery.getName, [regionMapQuery]);
  }, [regionMapQuery, regionQuery]);
};
