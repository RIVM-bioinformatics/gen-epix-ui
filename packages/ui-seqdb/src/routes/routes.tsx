import type { SeqDbApiPermission } from '@gen-epix/api-seqdb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { createRoutes as createCommonRoutes } from '@gen-epix/ui';
import type { MyNonIndexRouteObject } from '@gen-epix/ui';

import { createAdminRoutes } from './adminRoutes';

type RoutePermission = CommonDbApiPermission | SeqDbApiPermission;

export const createRoutes = (
  adminRoutes: MyNonIndexRouteObject<RoutePermission>[] = createAdminRoutes(),
): MyNonIndexRouteObject<RoutePermission>[] => {
  const rootChildren: MyNonIndexRouteObject<RoutePermission>[] = [];

  return createCommonRoutes<SeqDbApiPermission>({
    adminRoutes,
    rootChildren,
  });
};
