import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbDataCollection } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui-client-common/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';

export const useDataCollectionsQuery = (dataCollectionIds?: string[]): UseQueryResult<CaseDbDataCollection[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.getInstance().dataCollectionsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.DATA_COLLECTIONS),
    select: (items) => {
      if (dataCollectionIds) {
        return items.filter(item => dataCollectionIds.includes(item.id));
      }
      return items;
    },
  });
};

export const useDataCollectionsMapQuery = (dataCollectionIds?: string[]): UseMap<CaseDbDataCollection> => {
  const dataCollectionsQuery = useDataCollectionsQuery(dataCollectionIds);

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbDataCollection>(dataCollectionsQuery, item => item.id);
  }, [dataCollectionsQuery]);
};

export const useDataCollectionOptionsQuery = (dataCollectionIds?: string[]): UseOptions<string> => {
  const dataCollectionsQuery = useDataCollectionsQuery(dataCollectionIds);

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbDataCollection>(dataCollectionsQuery, item => item.id, item => item.name);
  }, [dataCollectionsQuery]);
};
