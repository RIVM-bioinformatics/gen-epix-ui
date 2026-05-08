import type { OmopDbApiPermission } from '@gen-epix/api-omopdb';
import { createAdminRoutes as createCommonAdminRoutes } from '@gen-epix/ui';
import type { MyNonIndexRouteObject } from '@gen-epix/ui';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';


type RoutePermission = CommonDbApiPermission | OmopDbApiPermission;

export const createAdminRoutes = (): MyNonIndexRouteObject<RoutePermission>[] => [
  ...createCommonAdminRoutes<OmopDbApiPermission>(),
];
