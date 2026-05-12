import type {
  COMMON_QUERY_KEY,
  MyNonIndexRouteObject,
} from '@gen-epix/ui';
import {
  ApiManager,
  COMMON_QUERY_DEPENDENCIES,
  QueryClientManager,
  RouterManager,
  setup,
} from '@gen-epix/ui';
import {
  SeqDbAbacApi,
  SeqDbAuthApi,
  SeqDbBaseAPI,
  SeqDbOrganizationApi,
  SeqDbSystemApi,
} from '@gen-epix/api-seqdb';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';

import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';
import type { SEQDB_QUERY_KEY } from '../data/query';
import { SEQDB_QUERY_DEPENDENCIES } from '../data/query';

export const setupSeqDb = () => {
  const adminRoutes = createAdminRoutes();
  const routes = createRoutes(adminRoutes);

  RouterManager.getInstance().initialize({
    adminRoutes: adminRoutes as MyNonIndexRouteObject[],
    homePageComponent: HomePage,
    routes: routes as MyNonIndexRouteObject[],
  });
  QueryClientManager.getInstance<COMMON_QUERY_KEY & SEQDB_QUERY_KEY>().initialize({
    queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, SEQDB_QUERY_DEPENDENCIES],
  });
  ApiManager.getInstance().initialize({
    abacApi: SeqDbAbacApi.getInstance(),
    authApi: SeqDbAuthApi.getInstance(),
    baseApi: SeqDbBaseAPI,
    organizationApi: SeqDbOrganizationApi.getInstance() as CommonDbOrganizationApi,
    systemApi: SeqDbSystemApi.getInstance(),
  });
  setup();
};
