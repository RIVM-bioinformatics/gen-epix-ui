import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbOrganizationShareCasePolicy } from '@gen-epix/api-casedb';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';

export const useOrganizationShareCasePoliciesQuery = (select?: (data: CaseDbOrganizationShareCasePolicy[]) => CaseDbOrganizationShareCasePolicy[]): UseQueryResult<CaseDbOrganizationShareCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().organizationShareCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.ORGANIZATION_SHARE_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
