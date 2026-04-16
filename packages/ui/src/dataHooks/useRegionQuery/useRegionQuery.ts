import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRegion } from '@gen-epix/api-casedb';
import { CaseDbGeoApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { useRegionSetsMapQuery } from '../useRegionSetsQuery';

export const useRegionQuery = (): UseQueryResult<CaseDbRegion[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbGeoApi.instance.regionsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REGIONS),
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
