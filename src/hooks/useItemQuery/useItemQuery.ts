import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  UseQueryOptions,
  QueryCacheNotifyEvent,
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

  useEffect(() => {
    const handleQueryCacheEvent = (event: QueryCacheNotifyEvent) => {
      if (Array.isArray(event.query.queryKey) && event.query.queryKey[0] === baseQueryKey && eventTypes.includes(event.type)) {
        if (event.query.queryKey.length === 1) {
          const list = (event.query.state.data as T[]);
          if ((event.type === 'added' || event.type === 'removed') && !list) {
            return;
          }
          setItemFromCache(list?.find(item => item.id === itemId));
        } else if (event.query.queryKey.length === 2 && (event.query.state.data as T)?.id === itemId) {
          setItemFromCache(event.query.state.data as T);
        }
      }
    };

    const removeListener = queryCache.subscribe(handleQueryCacheEvent);
    return () => {
      removeListener();
    };
  }, [baseQueryKey, itemId, queryCache]);

  const useQueryResult = useQueryMemo({
    ...useQueryOptions,
    queryKey: QueryUtil.getGenericKey(baseQueryKey, itemId),
    enabled: !itemFromCache && useQueryOptions.enabled,
  });

  const result = useMemo(() => {
    return {
      data: itemFromCache || useQueryResult.data,
      isLoading: itemFromCache ? false : useQueryResult.isLoading,
      isPending: itemFromCache ? false : useQueryResult.isPending,
      isFetching: itemFromCache ? false : useQueryResult.isFetching,
      error: itemFromCache ? false : useQueryResult.error,
    };
  }, [itemFromCache, useQueryResult.data, useQueryResult.isLoading, useQueryResult.isPending, useQueryResult.isFetching, useQueryResult.error]);

  return result;
};
