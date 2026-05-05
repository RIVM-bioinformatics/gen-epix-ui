import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbDataCollectionSetMember } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';


export const useDataCollectionSetMembersQuery = (): UseQueryResult<CaseDbDataCollectionSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.getInstance().dataCollectionSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.DATA_COLLECTION_SET_MEMBERS),
  });
};
