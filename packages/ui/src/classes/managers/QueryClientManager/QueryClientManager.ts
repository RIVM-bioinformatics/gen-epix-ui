import {
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';

import { ConfigManager } from '../ConfigManager';
import { HmrUtil } from '../../../utils/HmrUtil';

export class QueryClientManager {
  private static __instance: QueryClientManager;

  public readonly mutationCache: MutationCache;

  public readonly queryCache: QueryCache;
  public readonly queryClient: QueryClient;

  private constructor() {
    const queryCache = new QueryCache({});
    const mutationCache = new MutationCache({});
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Infinity,
          retry: ConfigManager.getInstance().config.queryClient.retry,
          retryDelay: ConfigManager.getInstance().config.queryClient.retryDelay,
          staleTime: Infinity,
        },
      },
      mutationCache,
      queryCache,
    });

    this.queryCache = queryCache;
    this.mutationCache = mutationCache;
    this.queryClient = queryClient;
  }

  public static getInstance(): QueryClientManager {
    QueryClientManager.__instance = HmrUtil.getHmrSingleton('queryClientManager', QueryClientManager.__instance, () => new QueryClientManager());
    return QueryClientManager.__instance;
  }
}
