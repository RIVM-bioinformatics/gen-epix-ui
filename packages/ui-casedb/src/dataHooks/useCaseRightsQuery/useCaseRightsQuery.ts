import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseRights } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useCaseRightsQuery = (caseIds: string[], caseTypeId: string, enabled: boolean = true): UseQueryResult<CaseDbCaseRights[]> => {
  console.log('useCaseRightsQuery', { caseIds, caseTypeId, enabled });
  return useQueryMemo({
    enabled,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseRights({
        case_ids: caseIds,
        case_type_id: caseTypeId,
      }, { signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_RIGHTS, caseIds),
  });

};
