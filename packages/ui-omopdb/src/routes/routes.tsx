import type { OmopDbApiPermission } from '@gen-epix/api-omopdb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  createRoutes as createCommonRoutes,
  type MyNonIndexRouteObject,
} from '@gen-epix/ui';

import { createAdminRoutes } from './adminRoutes';

type RoutePermission = CommonDbApiPermission | OmopDbApiPermission;

export const createRoutes = (
  adminRoutes: MyNonIndexRouteObject<RoutePermission>[] = createAdminRoutes(),
): MyNonIndexRouteObject<RoutePermission>[] => {
  const rootChildren: MyNonIndexRouteObject<RoutePermission>[] = [];

  return createCommonRoutes<OmopDbApiPermission>({
    adminRoutes,
    rootChildren,
  });
};
