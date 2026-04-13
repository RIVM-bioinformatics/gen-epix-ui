import type { UseQueryResult } from '@tanstack/react-query';
import type { OrganizationShareCasePolicy } from '@gen-epix/api-casedb';
import { AbacApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useOrganizationShareCasePoliciesQuery = (select?: (data: OrganizationShareCasePolicy[]) => OrganizationShareCasePolicy[]): UseQueryResult<OrganizationShareCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await AbacApi.instance.organizationShareCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_SHARE_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
