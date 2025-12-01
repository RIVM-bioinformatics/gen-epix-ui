import type { UseQueryResult } from '@tanstack/react-query';

import type { OrganizationShareCasePolicy } from '../../api';
import { AbacApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useOrganizationShareCasePoliciesQuery = (select?: (data: OrganizationShareCasePolicy[]) => OrganizationShareCasePolicy[]): UseQueryResult<OrganizationShareCasePolicy[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_SHARE_CASE_POLICIES),
    queryFn: async ({ signal }) => {
      const response = await AbacApi.instance.organizationShareCasePoliciesGetAll({ signal });
      return response.data;
    },
    select: select ? (data) => select(data) : undefined,
  });
};
