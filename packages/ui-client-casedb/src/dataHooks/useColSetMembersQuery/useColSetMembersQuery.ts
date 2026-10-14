import { container as rootContainer } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbColSetMember } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';


export const useColSetMembersQuery = (): UseQueryResult<CaseDbColSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(CaseDbCaseApi).colSetMembersGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: rootContainer.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.COL_SET_MEMBERS),
  });
};
