import type { UseQueryResult } from '@tanstack/react-query';
import type { ColSetMember } from '@gen-epix/api-casedb';
import { CaseApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useColSetMembersQuery = (): UseQueryResult<ColSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.colSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.COL_SET_MEMBERS),
  });
};
