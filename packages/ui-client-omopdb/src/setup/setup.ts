import type { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/react-router.models';
import { COMMON_QUERY_DEPENDENCIES } from '@gen-epix/ui-client-common/constants/query.constants';
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
import {
  API_ABAC_TOKEN,
  API_AUTH_TOKEN,
  API_BASE_TOKEN,
  API_ORGANIZATION_TOKEN,
  API_SYSTEM_TOKEN,
} from '@gen-epix/ui-client-common/constants/api.constants';
import { setupClientCommon } from '@gen-epix/ui-client-common/setup/setup';
import { container } from 'tsyringe';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';
import type { OMOPDB_QUERY_KEY } from '../constants/query.constants';
import { OMOPDB_QUERY_DEPENDENCIES } from '../constants/query.constants';
import type { OmopDbConfig } from '../models/config.models';

export const setupOmopDb = () => {
  const config = DependencyContainerUtil.resolveConfig<OmopDbConfig>();
  const adminRoutes = createAdminRoutes();
  const routes = createRoutes(adminRoutes);

  container.register(RouterService, {
    useValue: new RouterService({
      adminRoutes: adminRoutes as MyNonIndexRouteObject[],
      homePageComponent: HomePage,
      routes: routes as MyNonIndexRouteObject[],
    }),
  });
  container.register(QueryClientService, {
    useValue: new QueryClientService<COMMON_QUERY_KEY & OMOPDB_QUERY_KEY>({
      config,
      queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, OMOPDB_QUERY_DEPENDENCIES],
    }),
  });
  container.register(API_BASE_TOKEN, { useValue: OmopDbBaseAPI });
  container.register(API_ABAC_TOKEN, { useValue: container.resolve(OmopDbAbacApi) });
  container.register(API_AUTH_TOKEN, { useValue: container.resolve(OmopDbAuthApi) });
  container.register(API_ORGANIZATION_TOKEN, { useValue: container.resolve(OmopDbOrganizationApi) as CommonDbOrganizationApi });
  container.register(API_SYSTEM_TOKEN, { useValue: container.resolve(OmopDbSystemApi) });
  setupClientCommon();
};
