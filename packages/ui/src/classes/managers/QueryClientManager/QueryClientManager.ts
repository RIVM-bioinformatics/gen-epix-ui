import {
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';

import { WindowManager } from '../WindowManager';
import { ConfigManager } from '../ConfigManager';

export class QueryClientManager {
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
          retry: ConfigManager.instance.config.queryClient.retry,
          retryDelay: ConfigManager.instance.config.queryClient.retryDelay,
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
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.queryClient = WindowManager.instance.window.managers.queryClient || new QueryClientManager();
    return WindowManager.instance.window.managers.queryClient;
  }
}
