import type {
  DefaultError,
  QueryClient,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';


export const useQueryMemo = <TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseQueryResult<NoInfer<TData>, TError> => {
  const query = useQuery(options, queryClient);

  return useMemo(() => {
    return query;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.data,
    query.dataUpdatedAt,
    query.error,
    query.errorUpdatedAt,
    query.failureCount,
    query.failureReason,
    query.fetchStatus,
    query.isEnabled,
    query.isError,
    query.isFetched,
    query.isFetchedAfterMount,
    query.isFetching,
    query.isLoading,
    query.isLoadingError,
    query.isPaused,
    query.isPending,
    query.isPlaceholderData,
    query.isRefetchError,
    query.isRefetching,
    query.isStale,
    query.isSuccess,
    query.refetch,
    query.status,
  ]);
};
