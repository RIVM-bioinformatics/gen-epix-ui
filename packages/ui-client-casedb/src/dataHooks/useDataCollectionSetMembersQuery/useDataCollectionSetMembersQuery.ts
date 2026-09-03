import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbDataCollectionSetMember } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const useDataCollectionSetMembersQuery = (): UseQueryResult<CaseDbDataCollectionSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.getInstance().dataCollectionSetMembersGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.DATA_COLLECTION_SET_MEMBERS),
  });
};
