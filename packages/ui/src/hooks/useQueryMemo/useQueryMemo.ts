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
  }, [JSON.stringify({
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isPending: query.isPending,
  })]);
};
