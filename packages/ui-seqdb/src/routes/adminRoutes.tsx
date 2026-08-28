import type { SeqDbApiPermission } from '@gen-epix/api-seqdb';
import { createAdminRoutes as createCommonAdminRoutes } from '@gen-epix/ui/routes';
import type { MyNonIndexRouteObject } from '@gen-epix/ui/models/reactRouter';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';


type RoutePermission = CommonDbApiPermission | SeqDbApiPermission;

export const createAdminRoutes = (): MyNonIndexRouteObject<RoutePermission>[] => [
  ...createCommonAdminRoutes<SeqDbApiPermission>(),
];
