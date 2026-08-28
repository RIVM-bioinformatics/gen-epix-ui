import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbUserShareCasePolicy } from '@gen-epix/api-casedb';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const useUserShareCasePoliciesQuery = (select?: (data: CaseDbUserShareCasePolicy[]) => CaseDbUserShareCasePolicy[]): UseQueryResult<CaseDbUserShareCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().userShareCasePoliciesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.USER_SHARE_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
