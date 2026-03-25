import type { UseQueryResult } from '@tanstack/react-query';

import type { UserAccessCasePolicy } from '../../api';
import { AbacApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useUserAccessCasePoliciesQuery = (select?: (data: UserAccessCasePolicy[]) => UserAccessCasePolicy[]): UseQueryResult<UserAccessCasePolicy[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_ACCESS_CASE_POLICIES),
    queryFn: async ({ signal }) => {
      const response = await AbacApi.instance.userAccessCasePoliciesGetAll({ signal });
      return response.data;
    },
    select: select ? (data) => select(data) : undefined,
  });
};
