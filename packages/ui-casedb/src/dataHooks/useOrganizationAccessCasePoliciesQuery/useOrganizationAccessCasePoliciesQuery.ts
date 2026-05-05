import type { UseQueryResult } from '@tanstack/react-query';
import {
  CaseDbAbacApi,
  type CaseDbOrganizationAccessCasePolicy,
} from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';

export const useOrganizationAccessCasePoliciesQuery = (select?: (data: CaseDbOrganizationAccessCasePolicy[]) => CaseDbOrganizationAccessCasePolicy[]): UseQueryResult<CaseDbOrganizationAccessCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().organizationAccessCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
