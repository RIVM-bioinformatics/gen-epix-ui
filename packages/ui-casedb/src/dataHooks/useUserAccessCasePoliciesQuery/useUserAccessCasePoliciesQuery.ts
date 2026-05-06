import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbUserAccessCasePolicy } from '@gen-epix/api-casedb';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import {
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';

export const useUserAccessCasePoliciesQuery = (select?: (data: CaseDbUserAccessCasePolicy[]) => CaseDbUserAccessCasePolicy[]): UseQueryResult<CaseDbUserAccessCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().userAccessCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.USER_ACCESS_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
