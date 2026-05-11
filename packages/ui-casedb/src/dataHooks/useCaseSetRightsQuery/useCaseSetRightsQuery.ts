import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSetRights } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';

export const useCaseSetRightsQuery = (caseSetIds: string[]): UseQueryResult<CaseDbCaseSetRights[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseSetRights(caseSetIds, { signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SET_RIGHTS, caseSetIds),
  });
};
