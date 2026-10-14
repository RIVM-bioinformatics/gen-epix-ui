import type { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/react-router.models';
import { COMMON_QUERY_DEPENDENCIES } from '@gen-epix/ui-client-common/constants/query.constants';
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
import {
  API_ABAC_TOKEN,
  API_AUTH_TOKEN,
  API_BASE_TOKEN,
  API_ORGANIZATION_TOKEN,
  API_SYSTEM_TOKEN,
} from '@gen-epix/ui-client-common/models/api.models';

import { HomePage } from '../pages/HomePage';
import {
  createAdminRoutes,
  createRoutes,
} from '../routes';
import type { SEQDB_QUERY_KEY } from '../data/query';
import { SEQDB_QUERY_DEPENDENCIES } from '../data/query';
import type { SeqDbConfig } from '../models/config.models';

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
  container.register(API_BASE_TOKEN, { useValue: SeqDbBaseAPI });
  container.register(API_ABAC_TOKEN, { useValue: container.resolve(SeqDbAbacApi) });
  container.register(API_AUTH_TOKEN, { useValue: container.resolve(SeqDbAuthApi) });
  container.register(API_ORGANIZATION_TOKEN, { useValue: container.resolve(SeqDbOrganizationApi) as CommonDbOrganizationApi });
  container.register(API_SYSTEM_TOKEN, { useValue: container.resolve(SeqDbSystemApi) });
  setupUi();
};
