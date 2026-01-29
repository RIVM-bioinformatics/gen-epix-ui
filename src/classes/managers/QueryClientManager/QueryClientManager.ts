import {
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';

import { AxiosUtil } from '../../../utils/AxiosUtil';


export class QueryClientManager {
  private static __instance: QueryClientManager;

  public readonly queryCache: QueryCache;
  public readonly queryClient: QueryClient;
  public readonly mutationCache: MutationCache;

  private constructor() {
    const queryCache = new QueryCache({});
    const mutationCache = new MutationCache({});
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          gcTime: Infinity,
          // !FIXME: move to config
          retry: (import.meta.env.DEV)
            ? () => false
            : (failureCount: number, error: unknown) => {
              if (AxiosUtil.isAxiosInternalServerError(error) || AxiosUtil.isAxiosTimeoutError(error)) {
                return failureCount < 3;
              }
              return false;
            },
          retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 3000 : 3000, 30 * 1000),
        },
      },
      queryCache,
      mutationCache,
    });

    this.queryCache = queryCache;
    this.mutationCache = mutationCache;
    this.queryClient = queryClient;
  }

  public static get instance(): QueryClientManager {
    QueryClientManager.__instance = QueryClientManager.__instance || new QueryClientManager();
    return QueryClientManager.__instance;
  }
}
