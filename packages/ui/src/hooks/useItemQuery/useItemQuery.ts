import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  QueryCacheNotifyEvent,
  UseQueryOptions,
} from '@tanstack/react-query';

import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import type { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../useQueryMemo';

export type UseItemQueryProps<T extends GenericData> = {
  readonly baseQueryKey: QUERY_KEY;
  readonly itemId: string;
  readonly useQueryOptions: Omit<UseQueryOptions<T>, 'queryKey'>;
};

const eventTypes: QueryCacheNotifyEvent['type'][] = ['added', 'removed', 'updated'];

export const useItemQuery = <T extends GenericData>({
  baseQueryKey,
  itemId,
  useQueryOptions,
}: UseItemQueryProps<T>) => {
  const { queryCache } = QueryClientManager.instance;
  const [itemFromCache, setItemFromCache] = useState<T>(QueryUtil.getItemFromCache<T>(baseQueryKey, itemId));

  const useQueryResult = useQueryMemo({
    ...useQueryOptions,
    enabled: !itemFromCache && useQueryOptions.enabled,
    queryKey: QueryUtil.getGenericKey(baseQueryKey, itemId),
  });

  useEffect(() => {
    const handleQueryCacheEvent = (event: QueryCacheNotifyEvent) => {
      if (Array.isArray(event.query.queryKey) && event.query.queryKey[0] === baseQueryKey && eventTypes.includes(event.type)) {
        if (event.query.queryKey.length === 1) {
          const list = (event.query.state.data as T[]);
          if (event.type === 'removed') {
            setItemFromCache(undefined);
            return;
          }
          if (!list) {
            return;
          }
          const newValue = list?.find(item => item.id === itemId);
          if (JSON.stringify(itemFromCache) !== JSON.stringify(newValue)) {
            setItemFromCache(newValue);
          }
        } else if (event.query.queryKey.length === 2 && (event.query.state.data as T)?.id === itemId) {
          const newValue = event.query.state.data as T;
          if (JSON.stringify(itemFromCache) !== JSON.stringify(newValue)) {
            setItemFromCache(newValue);
          }
        }
      }
    };

    const removeListener = queryCache.subscribe(handleQueryCacheEvent);
    return () => {
      removeListener();
    };
  }, [baseQueryKey, itemId, queryCache, itemFromCache]);


  const result = useMemo(() => {
    return {
      data: itemFromCache || useQueryResult.data,
      error: itemFromCache ? false : useQueryResult.error,
      isEnabled: itemFromCache ? true : useQueryResult.isEnabled,
      isFetching: itemFromCache ? false : useQueryResult.isFetching,
      isLoading: itemFromCache ? false : useQueryResult.isLoading,
      isPending: itemFromCache ? false : useQueryResult.isPending,
    };
  }, [itemFromCache, useQueryResult.data, useQueryResult.isLoading, useQueryResult.isPending, useQueryResult.isFetching, useQueryResult.isEnabled, useQueryResult.error]);

  return result;
};
