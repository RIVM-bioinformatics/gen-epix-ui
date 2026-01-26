import { type UseQueryResult } from '@tanstack/react-query';

import type {
  RetrieveCaseTypeStatsRequestBody,
  CaseStats,
} from '../../api';
import { CaseApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypeStatsQuery = (options?: RetrieveCaseTypeStatsRequestBody): UseQueryResult<CaseStats[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_STATS, options ?? {}),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveCaseTypeStats(options ?? {}, { signal });
      return response.data;
    },
  });
};
