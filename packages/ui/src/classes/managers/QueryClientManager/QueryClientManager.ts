import {
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import {
  remove,
  uniq,
  uniqBy,
} from 'lodash';

import { ConfigManager } from '../ConfigManager';
import { HmrUtil } from '../../../utils/HmrUtil';
import type { GenericData } from '../../../models/data';

export class QueryClientManager<TQueryKey extends string = string> {
  private static __instance: QueryClientManager;
  public readonly mutationCache: MutationCache;

  public readonly queryCache: QueryCache;

  public readonly queryClient: QueryClient;

  public set queryKeyDependencies(queryKeyDependencies: Array<Record<TQueryKey, TQueryKey[]>>) {
    this.__queryKeyDependencies = QueryClientManager.mergeQueryKeyDependencies(queryKeyDependencies);
  }

  public get queryKeyDependencies(): Record<TQueryKey, TQueryKey[]> {
    if (!this.__queryKeyDependencies) {
      throw new Error('QueryKeyDependencies not set');
    }
    return this.__queryKeyDependencies;
  }
  private __queryKeyDependencies: Record<TQueryKey, TQueryKey[]>;

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

  public static getInstance<TQueryKey extends string>(): QueryClientManager<TQueryKey> {
    const instance = HmrUtil.getHmrSingleton<QueryClientManager<TQueryKey>>(
      'queryManager',
      QueryClientManager.__instance as QueryClientManager<TQueryKey> | undefined,
      () => new QueryClientManager<TQueryKey>(),
    );
    QueryClientManager.__instance = instance;
    return instance;
  }

  private static mergeQueryKeyDependencies<TQueryKey extends string>(dependencies: Array<Record<TQueryKey, TQueryKey[]>>): Record<TQueryKey, TQueryKey[]> {
    const merged: Record<TQueryKey, TQueryKey[]> = {} as Record<TQueryKey, TQueryKey[]>;
    dependencies.forEach(dependency => {
      Object.entries<TQueryKey[]>(dependency).forEach(([key, value]) => {
        if (!merged[key as TQueryKey]) {
          merged[key as TQueryKey] = [];
        }
        merged[key as TQueryKey].push(...value);
      });
    });
    Object.keys(merged).forEach(key => {
      merged[key as TQueryKey] = uniq(merged[key as TQueryKey]);
    });
    return merged;
  }

  public async cancelQueries(queryKeys: string[][]) {
    const queryClient = QueryClientManager.getInstance().queryClient;
    for (const queryKey of this.getUniqueQueryKeys(queryKeys ?? [])) {
      await queryClient.cancelQueries({ queryKey });
    }
  }

  public getGenericKey(key: TQueryKey, arg?: unknown) {
    const keyArray: string[] = [key];
    if (arg) {
      if (typeof arg === 'string') {
        keyArray.push(arg);
      } else {
        keyArray.push(JSON.stringify(arg));
      }
    }
    return keyArray;
  }

  public getItemFromCache<T extends GenericData>(queryKey: TQueryKey, itemId: string): T {
    const items = this.getValidQueryData<T[]>([queryKey]);
    return items?.find(item => item.id === itemId);
  }

  public getQueryKeyDependencies(queryKeys: TQueryKey[], includeSelf = false): string[][] {
    const keys: TQueryKey[][] = [];

    queryKeys.forEach(key => {
      keys.push(...this.getQueryKeyDependenciesInternal(key).map(k => [k]));
      if (includeSelf) {
        keys.unshift([key]);
      }
    });
    return this.getUniqueQueryKeys(keys);
  }

  public getUniqueQueryKeys<T>(queryKeys: T[][]): T[][] {
    return uniqBy(queryKeys, x => x.join('-'));
  }

  public getValidQueryData<T>(queryKey: string[]): T {
    const { queryCache, queryClient } = QueryClientManager.getInstance();
    const cache = queryCache.find({
      queryKey,
    });
    if (cache?.state?.isInvalidated) {
      return undefined;
    }
    return queryClient.getQueryData<T>(queryKey);
  }

  public async invalidateQueryKeys(queryKeys: string[][]) {
    const queryClient = QueryClientManager.getInstance().queryClient;
    for (const queryKey of this.getUniqueQueryKeys(queryKeys ?? [])) {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey });
    }
  }

  public removeQueries(queryKeys: string[][]) {
    const queryClient = QueryClientManager.getInstance().queryClient;
    for (const queryKey of this.getUniqueQueryKeys(queryKeys ?? [])) {
      queryClient.removeQueries({ queryKey });
    }
  }

  private getDirectQueryKeyDependents(key: TQueryKey): TQueryKey[] {
    return Object.entries<TQueryKey[]>(this.queryKeyDependencies)
      .filter(([, dependencyKeys]) => dependencyKeys.includes(key))
      .map(([dependentKey]) => dependentKey as TQueryKey);
  }

  private getQueryKeyDependenciesInternal(key: TQueryKey, currentKeys: TQueryKey[] = [], originalKey?: TQueryKey): TQueryKey[] {
    const keys: TQueryKey[] = [...currentKeys];
    this.getDirectQueryKeyDependents(key).forEach(dependentKey => {
      if (!keys.includes(dependentKey)) {
        keys.push(dependentKey);
        keys.push(...this.getQueryKeyDependenciesInternal(dependentKey, [...keys], originalKey ?? key));
      }
    });
    return remove(uniq(keys), x => x !== originalKey);
  }
}
