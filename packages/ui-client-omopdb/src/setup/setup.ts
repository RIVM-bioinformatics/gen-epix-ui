import type { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/reactRouter';
import { ApiService } from '@gen-epix/ui-client-common/classes/services/ApiService';
import { COMMON_QUERY_DEPENDENCIES } from '@gen-epix/ui-client-common/constants/query';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';
import {
  OmopDbAbacApi,
  OmopDbAuthApi,
  OmopDbBaseAPI,
  OmopDbOrganizationApi,
  OmopDbSystemApi,
} from '@gen-epix/api-omopdb';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';
import { setupUi } from '@gen-epix/ui-client-common/setup/setup';

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

  RouterService.getInstance().initialize({
    adminRoutes: adminRoutes as MyNonIndexRouteObject[],
    homePageComponent: HomePage,
    routes: routes as MyNonIndexRouteObject[],
  });
  QueryClientService.getInstance<COMMON_QUERY_KEY & OMOPDB_QUERY_KEY>().initialize({
    queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, OMOPDB_QUERY_DEPENDENCIES],
  });
  ApiService.getInstance().initialize({
    abacApi: OmopDbAbacApi.getInstance(),
    authApi: OmopDbAuthApi.getInstance(),
    baseApi: OmopDbBaseAPI,
    organizationApi: OmopDbOrganizationApi.getInstance() as CommonDbOrganizationApi,
    systemApi: OmopDbSystemApi.getInstance(),
  });
  setupUi();
};
