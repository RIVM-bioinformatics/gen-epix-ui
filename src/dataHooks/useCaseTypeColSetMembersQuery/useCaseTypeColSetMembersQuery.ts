import type { UseQueryResult } from '@tanstack/react-query';

import type { CaseTypeColSetMember } from '../../api';
import { CaseApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypeColSetMembersQuery = (): UseQueryResult<CaseTypeColSetMember[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_COL_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeColSetMembersGetAll({ signal });
      return response.data;
    },
  });
};
