import { COMMON_QUERY_DEPENDENCIES, COMMON_CASEDB_QUERY_KEY, setup as setupCommon, QueryKeyManager } from '@gen-epix/ui';
import { CASEDB_QUERY_DEPENDENCIES, CASEDB_CASEDB_QUERY_KEY } from '../data/query';

export const setup = () => {
  setupCommon();
  QueryKeyManager.getInstance<COMMON_CASEDB_QUERY_KEY & CASEDB_CASEDB_QUERY_KEY>().queryKeyDependencies = [COMMON_QUERY_DEPENDENCIES, CASEDB_QUERY_DEPENDENCIES];
};
