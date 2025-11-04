import uniq from 'lodash/uniq';
import remove from 'lodash/remove';
import uniqBy from 'lodash/uniqBy';

import type {
  CaseQuery,
  RetrievePhylogeneticTreeRequestBody,
} from '../../api';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { QUERY_KEY } from '../../models/query';

export const queryKeyDependencies: Record<QUERY_KEY, QUERY_KEY[]> = {
  [QUERY_KEY.ASSEMBLY_PROTOCOLS]: [],
  [QUERY_KEY.VALIDATE_CASES]: [],
  [QUERY_KEY.CASE_SET_CATEGORIES]: [],
  [QUERY_KEY.CASE_SET_MEMBERS]: [
    QUERY_KEY.CASE_SET_STATS,
    QUERY_KEY.CASE_IDS_BY_QUERY,
    QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET,
  ],
  [QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET]: [],
  [QUERY_KEY.CASE_SET_STATS]: [],
  [QUERY_KEY.CASE_SET_STATUSES]: [],
  [QUERY_KEY.CASE_SETS]: [
    QUERY_KEY.CASE_SET_STATS,
    QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET,
    QUERY_KEY.USER_ACCESS_CASE_POLICIES,
    QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES,
  ],
  [QUERY_KEY.CASE_TYPE_COL_SET_MEMBERS]: [],
  [QUERY_KEY.CASE_TYPE_COL_SETS]: [
    QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES,
    QUERY_KEY.USER_ACCESS_CASE_POLICIES,
  ],
  [QUERY_KEY.CASE_TYPE_COLS]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.CASE_TYPE_SET_CATEGORIES]: [],
  [QUERY_KEY.CASE_TYPE_SET_MEMBERS]: [],
  [QUERY_KEY.CASE_TYPE_SETS]: [],
  [QUERY_KEY.CASE_TYPE_STATS]: [],
  [QUERY_KEY.CASE_TYPES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
    QUERY_KEY.CASE_TYPE_STATS,
  ],
  [QUERY_KEY.CASES]: [
    QUERY_KEY.CASE_TYPE_STATS,
    QUERY_KEY.CASE_SET_STATS,
    QUERY_KEY.CASES_LAZY,
    QUERY_KEY.PHYLOGENETIC_TREE,
    QUERY_KEY.CASE_IDS_BY_QUERY,
    QUERY_KEY.CASE_SET_MEMBERS,
    QUERY_KEY.CASE_DATA_COLLECTION_LINKS,
  ],
  [QUERY_KEY.CASES_LAZY]: [],
  [QUERY_KEY.COLS]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.COMPLETE_CASE_TYPES]: [],
  [QUERY_KEY.CONCEPT_SETS]: [],
  [QUERY_KEY.CONCEPTS]: [],
  [QUERY_KEY.CONCEPT_RELATIONS]: [], // FIXME
  [QUERY_KEY.DATA_COLLECTIONS]: [
    QUERY_KEY.DATA_COLLECTION_SET_MEMBERS,
  ],
  [QUERY_KEY.DATA_COLLECTION_SETS]: [
    QUERY_KEY.DATA_COLLECTION_SET_MEMBERS,
  ],
  [QUERY_KEY.DATA_COLLECTION_SET_MEMBERS]: [],
  [QUERY_KEY.DIMS]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.DISEASES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.ETIOLOGICAL_AGENTS]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.ETIOLOGIES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.GENETIC_DISTANCE_PROTOCOLS]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.IDENTITY_PROVIDERS]: [],
  [QUERY_KEY.ORGANIZATION_ADMIN_NAME_EMAILS]: [],
  [QUERY_KEY.ORGANIZATION_ADMIN_POLICIES]: [
    QUERY_KEY.ORGANIZATION_ADMIN_NAME_EMAILS,
  ],
  [QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.ORGANIZATION_SHARE_CASE_POLICIES]: [], // FIXME
  [QUERY_KEY.USER_ACCESS_CASE_POLICIES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.USER_SHARE_CASE_POLICIES]: [], // FIXME
  [QUERY_KEY.ORGANIZATIONS]: [
    QUERY_KEY.ORGANIZATION_ADMIN_NAME_EMAILS,
    QUERY_KEY.INVITE_USER_CONSTRAINTS,
  ],
  [QUERY_KEY.OUTAGES]: [],
  [QUERY_KEY.PHYLOGENETIC_TREE]: [],
  [QUERY_KEY.REGION_SET_SHAPES]: [],
  [QUERY_KEY.REGION_SETS]: [
    QUERY_KEY.REGION_SETS_LAZY,
    QUERY_KEY.REGIONS,
  ],
  [QUERY_KEY.REGION_SETS_LAZY]: [],
  [QUERY_KEY.REGIONS_LAZY]: [],
  [QUERY_KEY.REGIONS]: [
    QUERY_KEY.REGIONS_LAZY,
  ],
  [QUERY_KEY.REGION_RELATIONS]: [], // FIXME
  [QUERY_KEY.CASE_IDS_BY_QUERY]: [],
  [QUERY_KEY.USER_ME]: [],
  [QUERY_KEY.USER_PERMISSIONS]: [],
  [QUERY_KEY.USER_REGISTRATIONS]: [],
  [QUERY_KEY.USERS]: [
    QUERY_KEY.USER_ACCESS_CASE_POLICIES,
    QUERY_KEY.USER_PERMISSIONS,
  ],
  [QUERY_KEY.LIBRARY_PREP_PROTOCOLS]: [],
  [QUERY_KEY.GENETIC_SEQUENCES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
    QUERY_KEY.PHYLOGENETIC_TREE,
  ],
  [QUERY_KEY.ALLELE_PROFILES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
    QUERY_KEY.PHYLOGENETIC_TREE,
  ],
  [QUERY_KEY.SUBJECTS]: [],
  [QUERY_KEY.TREE_ALGORITHM_CLASSES]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.TREE_ALGORITHMS]: [
    QUERY_KEY.COMPLETE_CASE_TYPES,
  ],
  [QUERY_KEY.CONTACTS]: [],
  [QUERY_KEY.CASE_DATA_COLLECTION_LINKS]: [
    QUERY_KEY.CASE_RIGHTS,
  ],
  [QUERY_KEY.CASE_SET_DATA_COLLECTION_LINKS]: [
    QUERY_KEY.CASE_SET_RIGHTS,
  ],
  [QUERY_KEY.CASE_RIGHTS]: [],
  [QUERY_KEY.CASE_SET_RIGHTS]: [],
  [QUERY_KEY.SITES]: [
    QUERY_KEY.CONTACTS,
  ],
  [QUERY_KEY.LICENSES]: [],
  [QUERY_KEY.INVITE_USER_CONSTRAINTS]: [],
};

export class QueryUtil {
  public static getRetrieveCaseIdsByQueryKey(completeCaseTypeId: string, caseQuery: CaseQuery) {
    const key: string[] = [QUERY_KEY.CASE_IDS_BY_QUERY, completeCaseTypeId, JSON.stringify(caseQuery)];
    return key;
  }

  public static getRetrievePhylogeneticTreeKey(requestBody: RetrievePhylogeneticTreeRequestBody) {
    const key: string[] = [QUERY_KEY.PHYLOGENETIC_TREE, JSON.stringify(requestBody)];
    return key;
  }

  public static getUserRegistrationsKey(token: string) {
    return QueryUtil.getGenericKey(QUERY_KEY.USER_REGISTRATIONS, token);
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

  private static getQueryKeyDependenciesInternal(key: QUERY_KEY, currentKeys: QUERY_KEY[] = [], originalKey?: QUERY_KEY): QUERY_KEY[] {
    const keys: QUERY_KEY[] = [...currentKeys];
    queryKeyDependencies[key].forEach(subKey => {
      if (!keys.includes(subKey)) {
        keys.push(subKey);
        keys.push(...QueryUtil.getQueryKeyDependenciesInternal(subKey, [...keys], originalKey ?? key));
      }
    });
    return remove(uniq(keys), x => x !== originalKey);
  }

  public static async cancelQueries(queryKeys: string[][]) {
    const queryClient = QueryClientManager.instance.queryClient;
    for (const queryKey of QueryUtil.getUniqueQueryKeys(queryKeys ?? [])) {
      await queryClient.cancelQueries({ queryKey });
    }
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

  public static getUniqueQueryKeys<T>(queryKeys: T[][]): T[][] {
    return uniqBy(queryKeys, x => x.join('-'));
  }

  public static getItemFromCache<T extends GenericData>(queryKey: QUERY_KEY, itemId: string): T {
    const items = QueryUtil.getValidQueryData<T[]>([queryKey]);
    return items?.find(item => item.id === itemId);
  }

  public static getValidQueryData<T>(queryKey: string[]): T {
    const { queryClient, queryCache } = QueryClientManager.instance;
    const cache = queryCache.find({
      queryKey,
    });
    if (cache?.state?.isInvalidated) {
      return undefined;
    }
    return queryClient.getQueryData<T>(queryKey);
  }
}
