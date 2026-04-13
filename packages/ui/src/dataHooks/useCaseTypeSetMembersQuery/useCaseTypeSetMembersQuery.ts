import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseTypeSetMember } from '@gen-epix/api-casedb';
import { CaseApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypeSetMembersQuery = (): UseQueryResult<CaseTypeSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseTypeSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SET_MEMBERS),
  });
};
