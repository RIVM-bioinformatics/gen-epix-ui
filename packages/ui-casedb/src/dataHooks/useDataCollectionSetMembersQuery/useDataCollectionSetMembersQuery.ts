import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbDataCollectionSetMember } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import {
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useDataCollectionSetMembersQuery = (): UseQueryResult<CaseDbDataCollectionSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.getInstance().dataCollectionSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.DATA_COLLECTION_SET_MEMBERS),
  });
};
