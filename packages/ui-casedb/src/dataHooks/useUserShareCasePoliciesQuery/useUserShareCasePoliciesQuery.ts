import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbUserShareCasePolicy } from '@gen-epix/api-casedb';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import {
  QueryKeyManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useUserShareCasePoliciesQuery = (select?: (data: CaseDbUserShareCasePolicy[]) => CaseDbUserShareCasePolicy[]): UseQueryResult<CaseDbUserShareCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().userShareCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryKeyManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.USER_SHARE_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
