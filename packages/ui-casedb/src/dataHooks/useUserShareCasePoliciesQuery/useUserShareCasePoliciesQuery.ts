import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbUserShareCasePolicy } from '@gen-epix/api-casedb';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';


export const useUserShareCasePoliciesQuery = (select?: (data: CaseDbUserShareCasePolicy[]) => CaseDbUserShareCasePolicy[]): UseQueryResult<CaseDbUserShareCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().userShareCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.USER_SHARE_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
