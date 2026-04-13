import type { UseQueryResult } from '@tanstack/react-query';
import type { DataCollectionSetMember } from '@gen-epix/api-casedb';
import { OrganizationApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useDataCollectionSetMembersQuery = (): UseQueryResult<DataCollectionSetMember[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.dataCollectionSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DATA_COLLECTION_SET_MEMBERS),
  });
};
