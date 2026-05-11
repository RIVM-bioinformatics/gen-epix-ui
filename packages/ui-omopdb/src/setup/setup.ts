import type {
  COMMON_QUERY_KEY,
  MyNonIndexRouteObject,
} from '@gen-epix/ui';
import {
  ApiManager,
  COMMON_QUERY_DEPENDENCIES,
  QueryClientManager,
  RouterManager,
  setup as setupCommon,
} from '@gen-epix/ui';
import {
  OmopDbAbacApi,
  OmopDbAuthApi,
  OmopDbBaseAPI,
  OmopDbOrganizationApi,
  OmopDbSystemApi,
} from '@gen-epix/api-omopdb';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';

import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';
import type { OMOPDB_QUERY_KEY } from '../data/query';
import { OMOPDB_QUERY_DEPENDENCIES } from '../data/query';

export const setupOmopDb = () => {
  const adminRoutes = createAdminRoutes();
  const routes = createRoutes(adminRoutes);

  RouterManager.getInstance().initialize({
    adminRoutes: adminRoutes as MyNonIndexRouteObject[],
    homePageComponent: HomePage,
    routes: routes as MyNonIndexRouteObject[],
  });
  QueryClientManager.getInstance<COMMON_QUERY_KEY & OMOPDB_QUERY_KEY>().initialize({
    queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, OMOPDB_QUERY_DEPENDENCIES],
  });
  ApiManager.getInstance().initialize({
    abacApi: OmopDbAbacApi.getInstance(),
    authApi: OmopDbAuthApi.getInstance(),
    baseApi: OmopDbBaseAPI,
    organizationApi: OmopDbOrganizationApi.getInstance() as CommonDbOrganizationApi,
    systemApi: OmopDbSystemApi.getInstance(),
  });
  setupCommon();
};
