import type { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/reactRouter';
import { ApiService } from '@gen-epix/ui-client-common/classes/services/ApiService';
import { COMMON_QUERY_DEPENDENCIES } from '@gen-epix/ui-client-common/constants/query';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';
import { setupUi } from '@gen-epix/ui-client-common/setup/setup';
import type { UiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';
import { resolveConfig } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';
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
import type { SeqDbConfig } from '../models/config';

export const setupSeqDb = (container: UiClientCommonContainer) => {
  const config = resolveConfig<SeqDbConfig>(container);
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
    useValue: new QueryClientService<COMMON_QUERY_KEY & SEQDB_QUERY_KEY>({
      config,
      queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES, SEQDB_QUERY_DEPENDENCIES],
    }),
  });
  container.register(ApiService, {
    useValue: new ApiService({
      abacApi: SeqDbAbacApi.getInstance(),
      authApi: SeqDbAuthApi.getInstance(),
      baseApi: SeqDbBaseAPI,
      organizationApi: SeqDbOrganizationApi.getInstance() as CommonDbOrganizationApi,
      systemApi: SeqDbSystemApi.getInstance(),
    }),
  });
  setupUi();
};
