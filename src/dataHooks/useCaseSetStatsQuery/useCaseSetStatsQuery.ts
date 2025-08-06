import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { CaseSetStat } from '../../api';
import { CaseApi } from '../../api';
import type { UseMap } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseSetStatsQuery = (): UseQueryResult<CaseSetStat[]> => {
  return useQueryMemo({
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
  }, [response]);
};
