import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseRights } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';


export const useCaseRightsQuery = (caseIds: string[], caseTypeId: string): UseQueryResult<CaseDbCaseRights[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseRights({
        case_ids: caseIds,
        case_type_id: caseTypeId,
      }, { signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_RIGHTS, caseIds),
  });

};
