import type { COMMON_QUERY_KEY } from '@gen-epix/ui';
import {
  COMMON_QUERY_DEPENDENCIES,
  QueryClientManager,
  RouterManager,
  setup as setupCommon,
} from '@gen-epix/ui';

import type { CASEDB_QUERY_KEY } from '../data/query';
import { CASEDB_QUERY_DEPENDENCIES } from '../data/query';
import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';

export const setup = () => {
  const adminRoutes = createAdminRoutes();

  setupCommon();
  RouterManager.getInstance().initialize({
    adminRoutes,
    homePageComponent: HomePage,
    routes: createRoutes(adminRoutes),
  });
  QueryClientManager.getInstance<CASEDB_QUERY_KEY & COMMON_QUERY_KEY>().initialize({
    queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, CASEDB_QUERY_DEPENDENCIES],
  });
};
