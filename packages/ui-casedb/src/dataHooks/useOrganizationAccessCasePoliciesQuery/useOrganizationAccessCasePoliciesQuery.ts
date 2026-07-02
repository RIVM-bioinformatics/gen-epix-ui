import type { UseQueryResult } from '@tanstack/react-query';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import type { CaseDbOrganizationAccessCasePolicy } from '@gen-epix/api-casedb';
import {
  QueryClientService,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';

export const useOrganizationAccessCasePoliciesQuery = (select?: (data: CaseDbOrganizationAccessCasePolicy[]) => CaseDbOrganizationAccessCasePolicy[]): UseQueryResult<CaseDbOrganizationAccessCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().organizationAccessCasePoliciesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
