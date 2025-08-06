import type { UseQueryResult } from '@tanstack/react-query';

import type { DataCollectionSetMember } from '../../api';
import { OrganizationApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useDataCollectionSetMembersQuery = (): UseQueryResult<DataCollectionSetMember[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DATA_COLLECTION_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.getInstance().dataCollectionSetMembersGetAll({ signal });
      return response.data;
    },
  });
};
