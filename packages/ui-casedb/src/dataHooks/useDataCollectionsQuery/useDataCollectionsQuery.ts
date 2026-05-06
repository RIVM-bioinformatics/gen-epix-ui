import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbDataCollection } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QueryKeyManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';

export const useDataCollectionsQuery = (dataCollectionIds?: string[]): UseQueryResult<CaseDbDataCollection[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.getInstance().dataCollectionsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryKeyManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.DATA_COLLECTIONS),
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
