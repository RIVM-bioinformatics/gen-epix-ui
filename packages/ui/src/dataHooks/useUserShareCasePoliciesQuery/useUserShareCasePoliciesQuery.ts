import type { UseQueryResult } from '@tanstack/react-query';

import type { UserShareCasePolicy } from '../../api';
import { AbacApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useUserShareCasePoliciesQuery = (select?: (data: UserShareCasePolicy[]) => UserShareCasePolicy[]): UseQueryResult<UserShareCasePolicy[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USER_SHARE_CASE_POLICIES),
    queryFn: async ({ signal }) => {
      const response = await AbacApi.instance.userShareCasePoliciesGetAll({ signal });
      return response.data;
    },
    select: select ? (data) => select(data) : undefined,
  });
};
