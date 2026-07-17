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
  CaseDbAbacApi,
  CaseDbAuthApi,
  CaseDbBaseAPI,
  CaseDbOrganizationApi,
  CaseDbSystemApi,
} from '@gen-epix/api-casedb';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';

import type { CASEDB_QUERY_KEY } from '../data/query';
import { CASEDB_QUERY_DEPENDENCIES } from '../data/query';
import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';

export const setupCaseDb = () => {
  RouterService.getInstance().initialize({
    adminRoutes: () => createAdminRoutes() as MyNonIndexRouteObject[],
    homePageComponent: HomePage,
    routes: () => createRoutes(RouterService.getInstance().adminRoutes) as MyNonIndexRouteObject[],
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
