import { type UseQueryResult } from '@tanstack/react-query';
import type {
  CaseDbCaseStats,
  CaseDbRetrieveCaseTypeStatsRequestBody,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypeStatsQuery = (options?: CaseDbRetrieveCaseTypeStatsRequestBody): UseQueryResult<CaseDbCaseStats[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.retrieveCaseTypeStats(options ?? {}, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_STATS, options ?? {}),
  });
};
