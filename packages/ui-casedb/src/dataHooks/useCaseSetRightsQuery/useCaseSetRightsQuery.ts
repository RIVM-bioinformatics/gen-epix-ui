import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSetRights } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';

export const useCaseSetRightsQuery = (caseSetIds: string[]): UseQueryResult<CaseDbCaseSetRights[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseSetRights(caseSetIds, { signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_SET_RIGHTS, caseSetIds),
  });
};
