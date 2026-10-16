import { container } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseTypeSetMember } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';


export const useCaseTypeSetMembersQuery = (): UseQueryResult<CaseDbCaseTypeSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(CaseDbCaseApi).caseTypeSetMembersGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.CASE_TYPE_SET_MEMBERS),
  });
};
