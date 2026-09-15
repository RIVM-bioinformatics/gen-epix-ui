import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRegionSet } from '@gen-epix/api-casedb';
import { CaseDbGeoApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui-client-common/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';

export const useRegionSetsQuery = (): UseQueryResult<CaseDbRegionSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbGeoApi.getInstance().regionSetsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGION_SETS),
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
