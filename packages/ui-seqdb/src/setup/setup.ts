import type {
  COMMON_QUERY_KEY,
  MyNonIndexRouteObject,
} from '@gen-epix/ui';
import {
  ApiService,
  COMMON_QUERY_DEPENDENCIES,
  QueryClientService,
  RouterService,
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

  RouterService.getInstance().initialize({
    adminRoutes: adminRoutes as MyNonIndexRouteObject[],
    homePageComponent: HomePage,
    routes: routes as MyNonIndexRouteObject[],
  });
  QueryClientService.getInstance<COMMON_QUERY_KEY & SEQDB_QUERY_KEY>().initialize({
    queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, SEQDB_QUERY_DEPENDENCIES],
  });
  ApiService.getInstance().initialize({
    abacApi: SeqDbAbacApi.getInstance(),
    authApi: SeqDbAuthApi.getInstance(),
    baseApi: SeqDbBaseAPI,
    organizationApi: SeqDbOrganizationApi.getInstance() as CommonDbOrganizationApi,
    systemApi: SeqDbSystemApi.getInstance(),
  });
  setup();
};
