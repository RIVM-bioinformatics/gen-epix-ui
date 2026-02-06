import {
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';

import { AxiosUtil } from '../../../utils/AxiosUtil';
import { WindowManager } from '../WindowManager';


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
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.queryClient = WindowManager.instance.window.managers.queryClient || new QueryClientManager();
    return WindowManager.instance.window.managers.queryClient;
  }
}
