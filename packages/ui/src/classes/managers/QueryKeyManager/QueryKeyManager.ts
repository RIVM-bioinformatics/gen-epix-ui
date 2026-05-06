import {
  remove,
  uniq,
  uniqBy,
} from 'lodash';

import type { GenericData } from '../../../models/data';
import { HmrUtil } from '../../../utils/HmrUtil';
import { QueryClientManager } from '../QueryClientManager';

export class QueryKeyManager<TQueryKey extends string = string> {
  private static __instance: unknown;
  public set queryKeyDependencies(queryKeyDependencies: Array<Record<TQueryKey, TQueryKey[]>>) {
    this.__queryKeyDependencies = QueryKeyManager.mergeQueryKeyDependencies(queryKeyDependencies);
  }

  public get queryKeyDependencies(): Record<TQueryKey, TQueryKey[]> {
    if (!this.__queryKeyDependencies) {
      throw new Error('QueryKeyDependencies not set');
    }
    return this.__queryKeyDependencies;
  }

  private __queryKeyDependencies: Record<TQueryKey, TQueryKey[]>;


  private constructor() {
    //
  }


  public static getInstance<TQueryKey extends string>(): QueryKeyManager<TQueryKey> {
    const instance = HmrUtil.getHmrSingleton<QueryKeyManager<TQueryKey>>(
      'queryManager',
      QueryKeyManager.__instance as QueryKeyManager<TQueryKey> | undefined,
      () => new QueryKeyManager<TQueryKey>(),
    );
    QueryKeyManager.__instance = instance;
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

  private getQueryKeyDependenciesInternal(key: TQueryKey, currentKeys: TQueryKey[] = [], originalKey?: TQueryKey): TQueryKey[] {
    const keys: TQueryKey[] = [...currentKeys];
    this.__queryKeyDependencies[key].forEach(subKey => {
      if (!keys.includes(subKey)) {
        keys.push(subKey);
        keys.push(...this.getQueryKeyDependenciesInternal(subKey, [...keys], originalKey ?? key));
      }
    });
    return remove(uniq(keys), x => x !== originalKey);
  }
}
