import type { COMMON_QUERY_KEY } from '@gen-epix/ui/constants/query';
import type { MyNonIndexRouteObject } from '@gen-epix/ui/models/reactRouter';
import { ApiService } from '@gen-epix/ui/classes/services/ApiService';
import { COMMON_QUERY_DEPENDENCIES } from '@gen-epix/ui/constants/query';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui/classes/services/RouterService';
import { setup } from '@gen-epix/ui/setup/setup';
import {
  CaseDbAbacApi,
  CaseDbAuthApi,
  CaseDbBaseAPI,
  CaseDbOrganizationApi,
  CaseDbSystemApi,
} from '@gen-epix/api-casedb';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';

import type { CASEDB_QUERY_KEY } from '../constants/query';
import { CASEDB_QUERY_DEPENDENCIES } from '../constants/query';
import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';

export const setupCaseDb = () => {
  const adminRoutes = createAdminRoutes();
  const routes = createRoutes(adminRoutes);

  RouterService.getInstance().initialize({
    adminRoutes: adminRoutes as MyNonIndexRouteObject[],
    homePageComponent: HomePage,
    routes: routes as MyNonIndexRouteObject[],
  });
  QueryClientService.getInstance<CASEDB_QUERY_KEY & COMMON_QUERY_KEY>().initialize({
    queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, CASEDB_QUERY_DEPENDENCIES],
  });
  ApiService.getInstance().initialize({
    abacApi: CaseDbAbacApi.getInstance(),
    authApi: CaseDbAuthApi.getInstance(),
    baseApi: CaseDbBaseAPI,
    organizationApi: CaseDbOrganizationApi.getInstance() as CommonDbOrganizationApi,
    systemApi: CaseDbSystemApi.getInstance(),
  });
  setup();
};
