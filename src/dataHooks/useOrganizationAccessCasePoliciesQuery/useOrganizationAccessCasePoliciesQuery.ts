import type { UseQueryResult } from '@tanstack/react-query';

import {
  AbacApi,
  type OrganizationAccessCasePolicy,
} from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useOrganizationAccessCasePoliciesQuery = (select?: (data: OrganizationAccessCasePolicy[]) => OrganizationAccessCasePolicy[]): UseQueryResult<OrganizationAccessCasePolicy[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES),
    queryFn: async ({ signal }) => {
      const response = await AbacApi.getInstance().organizationAccessCasePoliciesGetAll({ signal });
      return response.data;
    },
    select: select ? (data) => select(data) : undefined,
  });
};
