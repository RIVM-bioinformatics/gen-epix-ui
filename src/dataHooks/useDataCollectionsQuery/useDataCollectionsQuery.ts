import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { DataCollection } from '../../api';
import { OrganizationApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useDataCollectionsQuery = (dataCollectionIds?: string[]): UseQueryResult<DataCollection[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DATA_COLLECTIONS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.dataCollectionsGetAll({ signal });
      return response.data;
    },
    select: (items) => {
      if (dataCollectionIds) {
        return items.filter(item => dataCollectionIds.includes(item.id));
      }
      return items;
    },
  });
};

export const useDataCollectionsMapQuery = (dataCollectionIds?: string[]): UseMap<DataCollection> => {
  const dataCollectionsQuery = useDataCollectionsQuery(dataCollectionIds);

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<DataCollection>(dataCollectionsQuery, item => item.id);
  }, [dataCollectionsQuery]);
};

export const useDataCollectionOptionsQuery = (dataCollectionIds?: string[]): UseOptions<string> => {
  const dataCollectionsQuery = useDataCollectionsQuery(dataCollectionIds);

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<DataCollection>(dataCollectionsQuery, item => item.id, item => item.name);
  }, [dataCollectionsQuery]);
};
