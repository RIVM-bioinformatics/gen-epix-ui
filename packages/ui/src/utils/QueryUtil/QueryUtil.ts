import uniq from 'lodash/uniq';
import remove from 'lodash/remove';
import uniqBy from 'lodash/uniqBy';
import type {
  CaseQuery,
  RetrievePhylogeneticTreeRequestBody,
} from '@gen-epix/api-casedb';

import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { QUERY_KEY } from '../../models/query';
import { QUERY_DEPENDENCIES } from '../../data/queryDependencies';

export class QueryUtil {
  public static async cancelQueries(queryKeys: string[][]) {
    const queryClient = QueryClientManager.instance.queryClient;
    for (const queryKey of QueryUtil.getUniqueQueryKeys(queryKeys ?? [])) {
      await queryClient.cancelQueries({ queryKey });
    }
  }

  public static getGenericKey(key: QUERY_KEY, arg?: unknown) {
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

  public static getItemFromCache<T extends GenericData>(queryKey: QUERY_KEY, itemId: string): T {
    const items = QueryUtil.getValidQueryData<T[]>([queryKey]);
    return items?.find(item => item.id === itemId);
  }

  public static getQueryKeyDependencies(queryKeys: QUERY_KEY[], includeSelf = false): string[][] {
    const keys: QUERY_KEY[][] = [];

    queryKeys.forEach(key => {
      keys.push(...QueryUtil.getQueryKeyDependenciesInternal(key).map(k => [k]));
      if (includeSelf) {
        keys.unshift([key]);
      }
    });
    return QueryUtil.getUniqueQueryKeys(keys);
  }

  public static getRetrieveCaseIdsByQueryKey(completeCaseTypeId: string, caseQuery: CaseQuery) {
    const key: string[] = [QUERY_KEY.CASE_IDS_BY_QUERY, completeCaseTypeId, JSON.stringify(caseQuery)];
    return key;
  }

  public static getRetrievePhylogeneticTreeKey(requestBody: RetrievePhylogeneticTreeRequestBody) {
    const key: string[] = [QUERY_KEY.PHYLOGENETIC_TREE, JSON.stringify(requestBody)];
    return key;
  }

  public static getUniqueQueryKeys<T>(queryKeys: T[][]): T[][] {
    return uniqBy(queryKeys, x => x.join('-'));
  }

  public static getUserRegistrationsKey(token: string) {
    return QueryUtil.getGenericKey(QUERY_KEY.USER_INVITATIONS, token);
  }

  public static getValidQueryData<T>(queryKey: string[]): T {
    const { queryCache, queryClient } = QueryClientManager.instance;
    const cache = queryCache.find({
      queryKey,
    });
    if (cache?.state?.isInvalidated) {
      return undefined;
    }
    return queryClient.getQueryData<T>(queryKey);
  }

  public static async invalidateQueryKeys(queryKeys: string[][]) {
    const queryClient = QueryClientManager.instance.queryClient;
    for (const queryKey of QueryUtil.getUniqueQueryKeys(queryKeys ?? [])) {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey });
    }
  }

  public static removeQueries(queryKeys: string[][]) {
    const queryClient = QueryClientManager.instance.queryClient;
    for (const queryKey of QueryUtil.getUniqueQueryKeys(queryKeys ?? [])) {
      queryClient.removeQueries({ queryKey });
    }
  }

  private static getQueryKeyDependenciesInternal(key: QUERY_KEY, currentKeys: QUERY_KEY[] = [], originalKey?: QUERY_KEY): QUERY_KEY[] {
    const keys: QUERY_KEY[] = [...currentKeys];
    QUERY_DEPENDENCIES[key].forEach(subKey => {
      if (!keys.includes(subKey)) {
        keys.push(subKey);
        keys.push(...QueryUtil.getQueryKeyDependenciesInternal(subKey, [...keys], originalKey ?? key));
      }
    });
    return remove(uniq(keys), x => x !== originalKey);
  }
}
