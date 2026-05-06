import type { COMMON_QUERY_KEY } from '@gen-epix/ui';
import {
  COMMON_QUERY_DEPENDENCIES,
  QueryClientManager,
  setup as setupCommon,
} from '@gen-epix/ui';

import type { CASEDB_QUERY_KEY } from '../data/query';
import { CASEDB_QUERY_DEPENDENCIES } from '../data/query';

export const setup = () => {
  setupCommon();
  QueryClientManager.getInstance<CASEDB_QUERY_KEY & COMMON_QUERY_KEY>().queryKeyDependencies = [COMMON_QUERY_DEPENDENCIES, CASEDB_QUERY_DEPENDENCIES];
};
