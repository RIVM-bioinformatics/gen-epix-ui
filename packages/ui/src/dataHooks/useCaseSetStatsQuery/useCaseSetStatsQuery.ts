import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { CaseStats } from '../../api';
import { CaseApi } from '../../api';
import type { UseMap } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseSetStatsQuery = (caseSetIds: string[]): UseQueryResult<CaseStats[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_STATS, caseSetIds),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveCaseSetStats({
        case_set_ids: caseSetIds,
      }, { signal });
      return response.data;
    },
    enabled: !!caseSetIds?.length,
  });
};

export const useCaseSetStatsMapQuery = (caseSetIds: string[]): UseMap<CaseStats> => {
  const response = useCaseSetStatsQuery(caseSetIds);

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseStats>(response, item => item.case_set_id);
  }, [response]);
};
