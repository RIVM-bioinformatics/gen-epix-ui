import {
  remove,
  uniq,
  uniqBy,
} from 'lodash';

import { QUERY_DEPENDENCIES } from '../../../data/queryDependencies';
import type { GenericData } from '../../../models/data';
import { QUERY_KEY } from '../../../models/query';
import { HmrUtil } from '../../../utils/HmrUtil';
import { QueryClientManager } from '../QueryClientManager';

export class QueryManager {
  private static __instance: QueryManager;


  private constructor() {
    //
  }

  public static getInstance(): QueryManager {
    QueryManager.__instance = HmrUtil.getHmrSingleton('queryManager', QueryManager.__instance, () => new QueryManager());
    return QueryManager.__instance;
  }

  public async cancelQueries(queryKeys: string[][]) {
    const queryClient = QueryClientManager.getInstance().queryClient;
    for (const queryKey of this.getUniqueQueryKeys(queryKeys ?? [])) {
      await queryClient.cancelQueries({ queryKey });
    }
  }

  public getGenericKey(key: QUERY_KEY, arg?: unknown) {
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

  public getItemFromCache<T extends GenericData>(queryKey: QUERY_KEY, itemId: string): T {
    const items = this.getValidQueryData<T[]>([queryKey]);
    return items?.find(item => item.id === itemId);
  }

  public getQueryKeyDependencies(queryKeys: QUERY_KEY[], includeSelf = false): string[][] {
    const keys: QUERY_KEY[][] = [];

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

  public getUserRegistrationsKey(token: string) {
    return this.getGenericKey(QUERY_KEY.USER_INVITATIONS, token);
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

  private getQueryKeyDependenciesInternal(key: QUERY_KEY, currentKeys: QUERY_KEY[] = [], originalKey?: QUERY_KEY): QUERY_KEY[] {
    const keys: QUERY_KEY[] = [...currentKeys];
    QUERY_DEPENDENCIES[key].forEach(subKey => {
      if (!keys.includes(subKey)) {
        keys.push(subKey);
        keys.push(...this.getQueryKeyDependenciesInternal(subKey, [...keys], originalKey ?? key));
      }
    });
    return remove(uniq(keys), x => x !== originalKey);
  }
}
