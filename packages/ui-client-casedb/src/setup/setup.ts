import type { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/react-router.models';
import { COMMON_QUERY_DEPENDENCIES } from '@gen-epix/ui-client-common/constants/query.constants';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';
import { setupClientCommon } from '@gen-epix/ui-client-common/setup/setup';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import {
  CaseDbAbacApi,
  CaseDbAuthApi,
  CaseDbBaseAPI,
  CaseDbOrganizationApi,
  CaseDbSystemApi,
} from '@gen-epix/api-casedb';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';
import {
  API_ABAC_TOKEN,
  API_AUTH_TOKEN,
  API_BASE_TOKEN,
  API_ORGANIZATION_TOKEN,
  API_SYSTEM_TOKEN,
} from '@gen-epix/ui-client-common/constants/api.constants';
import { container } from 'tsyringe';

import type { CaseDbConfig } from '../models/config.models';
import type { CASEDB_QUERY_KEY } from '../constants/query.constants';
import { CASEDB_QUERY_DEPENDENCIES } from '../constants/query.constants';
import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';

export const setupCaseDb = () => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  container.register(RouterService, {
    useValue: new RouterService({
      adminRoutes: () => createAdminRoutes() as MyNonIndexRouteObject[],
      homePageComponent: HomePage,
      routes: () => createRoutes(container.resolve(RouterService).adminRoutes) as MyNonIndexRouteObject[],
    }),
  });
  container.register(QueryClientService, {
    useValue: new QueryClientService<CASEDB_QUERY_KEY & COMMON_QUERY_KEY>({
      config,
      queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, CASEDB_QUERY_DEPENDENCIES],
    }),
  });
  container.register(API_BASE_TOKEN, { useValue: CaseDbBaseAPI });
  container.register(API_ABAC_TOKEN, { useValue: container.resolve(CaseDbAbacApi) });
  container.register(API_AUTH_TOKEN, { useValue: container.resolve(CaseDbAuthApi) });
  container.register(API_ORGANIZATION_TOKEN, { useValue: container.resolve(CaseDbOrganizationApi) as CommonDbOrganizationApi });
  container.register(API_SYSTEM_TOKEN, { useValue: container.resolve(CaseDbSystemApi) });
  setupClientCommon();
};
