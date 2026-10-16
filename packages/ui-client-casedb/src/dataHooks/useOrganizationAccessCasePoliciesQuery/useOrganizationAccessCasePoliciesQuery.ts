import { container } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import type { CaseDbOrganizationAccessCasePolicy } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';

export const useOrganizationAccessCasePoliciesQuery = (select?: (data: CaseDbOrganizationAccessCasePolicy[]) => CaseDbOrganizationAccessCasePolicy[]): UseQueryResult<CaseDbOrganizationAccessCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(CaseDbAbacApi).organizationAccessCasePoliciesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
