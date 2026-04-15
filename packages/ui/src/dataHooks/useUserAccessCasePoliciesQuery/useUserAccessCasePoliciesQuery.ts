import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbUserAccessCasePolicy } from '@gen-epix/api-casedb';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useUserAccessCasePoliciesQuery = (select?: (data: CaseDbUserAccessCasePolicy[]) => CaseDbUserAccessCasePolicy[]): UseQueryResult<CaseDbUserAccessCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.instance.userAccessCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_ACCESS_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
