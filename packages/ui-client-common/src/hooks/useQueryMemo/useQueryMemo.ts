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

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, [JSON.stringify({
    data: query.data,
    error: query.error,
    isEnabled: query.isEnabled,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    isPending: query.isPending,
  })]);
};
