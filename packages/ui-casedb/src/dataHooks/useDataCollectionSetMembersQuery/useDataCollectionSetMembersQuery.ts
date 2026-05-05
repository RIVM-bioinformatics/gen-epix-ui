import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbDataCollectionSetMember } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useDataCollectionSetMembersQuery = (): UseQueryResult<CaseDbDataCollectionSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.instance.dataCollectionSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DATA_COLLECTION_SET_MEMBERS),
  });
};
