import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbOrganizationShareCasePolicy } from '@gen-epix/api-casedb';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';

export const useOrganizationShareCasePoliciesQuery = (select?: (data: CaseDbOrganizationShareCasePolicy[]) => CaseDbOrganizationShareCasePolicy[]): UseQueryResult<CaseDbOrganizationShareCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.getInstance().organizationShareCasePoliciesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.ORGANIZATION_SHARE_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
