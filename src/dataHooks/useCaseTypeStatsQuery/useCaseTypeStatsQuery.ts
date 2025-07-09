import { type UseQueryResult } from '@tanstack/react-query';

import type {
  RetrieveCaseTypeStatsCommand,
  CaseTypeStat,
} from '../../api';
import { CaseApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypeStatsQuery = (options?: RetrieveCaseTypeStatsCommand): UseQueryResult<CaseTypeStat[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_STATS, options ?? {}),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveCaseTypeStats(options ?? {}, { signal });
      return response.data;
    },
  });
};
