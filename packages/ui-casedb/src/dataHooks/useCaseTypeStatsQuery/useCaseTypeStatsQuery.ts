import { type UseQueryResult } from '@tanstack/react-query';
import type {
  CaseDbCaseStats,
  CaseDbRetrieveCaseTypeStatsRequestBody,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';


export const useCaseTypeStatsQuery = (options?: CaseDbRetrieveCaseTypeStatsRequestBody): UseQueryResult<CaseDbCaseStats[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseTypeStats(options ?? {}, { signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_TYPE_STATS, options ?? {}),
  });
};
