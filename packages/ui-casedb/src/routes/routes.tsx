/* eslint-disable @typescript-eslint/naming-convention */
import type { CaseDbApiPermission } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { t } from 'i18next';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  createRoutes as createCommonRoutes,
  type MyNonIndexRouteObject,
  RouterErrorPage,
} from '@gen-epix/ui';

import { CasesDetailPage } from '../pages/CasesDetailPage';
import { CasesPage } from '../pages/CasesPage';
import { EventsDetailPage } from '../pages/EventsDetailPage';
import { EventsPage } from '../pages/EventsPage';
import { TrendsPage } from '../pages/TrendsPage';
import { UploadPage } from '../pages/UploadPage';

import { createAdminRoutes } from './adminRoutes';

type RoutePermission = CaseDbApiPermission | CommonDbApiPermission;

export const createRoutes = (
  adminRoutes: MyNonIndexRouteObject<RoutePermission>[] = createAdminRoutes(),
): MyNonIndexRouteObject<RoutePermission>[] => {
  const rootChildren: MyNonIndexRouteObject<RoutePermission>[] = [
    {
      children: [
        {
          Component: CasesPage,
          errorElement: <RouterErrorPage />,
          handle: {
            hidden: false,
            requiredPermissions: [
              { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.RetrieveCaseStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
            ],
            requiresUserProfile: true,
            title: t`Cases`,
          },
          index: true,
          path: '/cases',
        },
        {
          Component: CasesDetailPage,
          errorElement: <RouterErrorPage />,
          handle: {
            hidden: false,
            requiredPermissions: [
              { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.RetrieveCasesByIdCommand, permission_type: CaseDbPermissionType.EXECUTE },
              { command_name: CaseDbCommandName.RetrieveCasesByQueryCommand, permission_type: CaseDbPermissionType.EXECUTE },
              { command_name: CaseDbCommandName.RetrievePhylogeneticTreeByCasesCommand, permission_type: CaseDbPermissionType.EXECUTE },
            ],
            requiresUserProfile: true,
            title: t`Case type`,
          },
          path: '/cases/:slug/:caseTypeId',
        },
      ],
      errorElement: <RouterErrorPage />,
      handle: {
        hidden: false,
        requiredPermissions: [],
        requiresUserProfile: true,
        title: t`Cases`,
      },
      path: '/cases',
    },
    {
      children: [
        {
          Component: EventsPage,
          errorElement: <RouterErrorPage />,
          handle: {
            hidden: false,
            requiredPermissions: [
              { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseSetStatusCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.RetrieveCaseStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
            ],
            requiresUserProfile: true,
            title: t`Events`,
          },
          index: true,
        },
        {
          Component: EventsDetailPage,
          errorElement: <RouterErrorPage />,
          handle: {
            hidden: false,
            requiredPermissions: [
              { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.READ },
              { command_name: CaseDbCommandName.RetrieveCasesByIdCommand, permission_type: CaseDbPermissionType.EXECUTE },
              { command_name: CaseDbCommandName.RetrieveCasesByQueryCommand, permission_type: CaseDbPermissionType.EXECUTE },
              { command_name: CaseDbCommandName.RetrievePhylogeneticTreeByCasesCommand, permission_type: CaseDbPermissionType.EXECUTE },
              { command_name: CaseDbCommandName.RetrievePhylogeneticTreeByCasesCommand, permission_type: CaseDbPermissionType.EXECUTE },
            ],
            requiresUserProfile: true,
            title: t`Event`,
          },
          path: '/events/:slug/:caseSetId',
        },
      ],
      errorElement: <RouterErrorPage />,
      handle: {
        hidden: false,
        requiredPermissions: [],
        requiresUserProfile: true,
        title: t`Events`,
      },
      path: '/events',
    },
    {
      Component: TrendsPage,
      errorElement: <RouterErrorPage />,
      handle: {
        disabled: true,
        requiredPermissions: [],
        requiresUserProfile: true,
        title: t`Trends`,
      },
      path: '/trends',
    },
    {
      Component: UploadPage,
      errorElement: <RouterErrorPage />,
      handle: {
        requiredPermissions: [
          { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
          { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
          { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
          { command_name: CaseDbCommandName.RetrieveProtocolsCommand, permission_type: CaseDbPermissionType.EXECUTE },
          { command_name: CaseDbCommandName.CreateFileForReadSetCommand, permission_type: CaseDbPermissionType.EXECUTE },
          { command_name: CaseDbCommandName.CreateFileForSeqCommand, permission_type: CaseDbPermissionType.EXECUTE },
          { command_name: CaseDbCommandName.UploadCasesCommand, permission_type: CaseDbPermissionType.EXECUTE },
        ],
        requiresUserProfile: true,
        title: t`Upload`,
      },
      path: '/upload',
    },
  ];

  return createCommonRoutes<CaseDbApiPermission>({
    adminRoutes,
    rootChildren,
  });
};
