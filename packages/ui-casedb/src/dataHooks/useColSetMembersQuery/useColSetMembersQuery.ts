import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbColSetMember } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useColSetMembersQuery = (): UseQueryResult<CaseDbColSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().colSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.COL_SET_MEMBERS),
  });
};
