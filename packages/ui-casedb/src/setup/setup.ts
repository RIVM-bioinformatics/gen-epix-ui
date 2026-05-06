import type { COMMON_QUERY_KEY } from '@gen-epix/ui';
import {
  COMMON_QUERY_DEPENDENCIES,
  createRoutes,
  QueryClientManager,
  RouterManager,
  setup as setupCommon,
} from '@gen-epix/ui';

import type { CASEDB_QUERY_KEY } from '../data/query';
import { CASEDB_QUERY_DEPENDENCIES } from '../data/query';
import { HomePage } from '../pages/HomePage';

export const setup = () => {
  setupCommon();
  RouterManager.getInstance().initialize({
    homePageComponent: HomePage,
    routes: createRoutes(),
  });
  QueryClientManager.getInstance<CASEDB_QUERY_KEY & COMMON_QUERY_KEY>().initialize({
    queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, CASEDB_QUERY_DEPENDENCIES],
  });
};
