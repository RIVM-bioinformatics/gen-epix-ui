/* eslint-disable @typescript-eslint/naming-convention */
import type { SeqDbApiPermission } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
} from '@gen-epix/api-seqdb';
import { createAdminRoutes as createCommonAdminRoutes } from '@gen-epix/ui-client-common/routes';
import { ADMIN_PAGE_CATEGORY } from '@gen-epix/ui-client-common/models/admin.models';
import { RouterErrorPage } from '@gen-epix/ui-client-common/pages/RouterErrorPage';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/react-router.models';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { t } from 'i18next';

import { AllelesAdminPage } from '../pages/AllelesAdminPage';

type RoutePermission = CommonDbApiPermission | SeqDbApiPermission;

export const createAdminRoutes = (): MyNonIndexRouteObject<RoutePermission>[] => [
  ...createCommonAdminRoutes<SeqDbApiPermission>(),
  {
    Component: AllelesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: SeqDbCommandName.AlleleCrudCommand, permission_type: SeqDbPermissionType.READ },
        { command_name: SeqDbCommandName.LocusCrudCommand, permission_type: SeqDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage alleles`,
      title: t`Alleles`,
    },
    path: '/management/alleles',
  },
];
