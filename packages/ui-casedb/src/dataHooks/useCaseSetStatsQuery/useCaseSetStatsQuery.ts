import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseStats } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { UseMap } from '@gen-epix/ui';
import {
  DataHookUtil,
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useCaseSetStatsQuery = (caseSetIds: string[]): UseQueryResult<CaseDbCaseStats[]> => {
  return useQueryMemo({
    enabled: !!caseSetIds?.length,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseSetStats({
        case_set_ids: caseSetIds,
      }, { signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SET_STATS, caseSetIds),
  });
};

export const useCaseSetStatsMapQuery = (caseSetIds: string[]): UseMap<CaseDbCaseStats> => {
  const response = useCaseSetStatsQuery(caseSetIds);

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseStats>(response, item => item.case_set_id);
  }, [response]);
};
