import type { COMMON_QUERY_KEY } from '@gen-epix/ui/constants/query';
import type { MyNonIndexRouteObject } from '@gen-epix/ui/models/reactRouter';
import { ApiService } from '@gen-epix/ui/classes/services/ApiService';
import { COMMON_QUERY_DEPENDENCIES } from '@gen-epix/ui/constants/query';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui/classes/services/RouterService';
import { setupUi } from '@gen-epix/ui/setup/setup';
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
  setupUi();
};
