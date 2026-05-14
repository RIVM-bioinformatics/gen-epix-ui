import type { UseQueryResult } from '@tanstack/react-query';
import type {
  CaseDbCaseStats,
  CaseDbRetrieveCaseTypeStatsRequestBody,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useCaseTypeStatsQuery = (options?: CaseDbRetrieveCaseTypeStatsRequestBody): UseQueryResult<CaseDbCaseStats[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseTypeStats(options ?? {}, { signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_TYPE_STATS, options ?? {}),
  });
};
