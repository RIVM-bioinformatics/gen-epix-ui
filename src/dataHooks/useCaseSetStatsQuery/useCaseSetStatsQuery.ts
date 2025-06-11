import { useMemo } from 'react';
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { CaseSetStat } from '../../api';
import { CaseApi } from '../../api';
import type { UseMap } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useCaseSetStatsQuery = (): UseQueryResult<CaseSetStat[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_STATS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveCaseSetStats({ signal });
      return response.data;
    },
  });
};

export const useCaseSetStatsMapQuery = (): UseMap<CaseSetStat> => {
  const response = useCaseSetStatsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSetStat>(response, item => item.case_set_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
