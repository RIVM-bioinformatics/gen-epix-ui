/* eslint-disable @typescript-eslint/naming-convention */
import HomeIcon from '@mui/icons-material/Home';
import type { CaseDbApiPermission } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { t } from 'i18next';
import type { MyNonIndexRouteObject } from '@gen-epix/ui';
import {
  AcceptInvitationPage,
  AdminPage,
  PostLoginPage,
  PostLogoutPage,
  RouterErrorPage,
  RouterRoot,
} from '@gen-epix/ui';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';

import { CasesDetailPage } from '../pages/CasesDetailPage';
import { CasesPage } from '../pages/CasesPage';
import { EventsDetailPage } from '../pages/EventsDetailPage';
import { EventsPage } from '../pages/EventsPage';
import { TrendsPage } from '../pages/TrendsPage';
import { UploadPage } from '../pages/UploadPage';

import { createAdminRoutes } from './adminRoutes';

export const createRoutes = (): MyNonIndexRouteObject<CaseDbApiPermission | CommonDbApiPermission>[] => {
  const adminRoutes = createAdminRoutes();

  return [
    {
      Component: PostLogoutPage,
      errorElement: <RouterErrorPage />,
      handle: {
        hidden: true,
        requiredPermissions: [],
        requiresUserProfile: false,
        title: t`Post Logout`,
      },
      path: '/post-logout',
    },
    {
      children: [
        {
          Component: AcceptInvitationPage,
          errorElement: <RouterErrorPage />,
          handle: {
            hidden: true,
            requiredPermissions: [],
            requiresUserProfile: false,
            title: t`Accept Invitation`,
          },
          path: '/accept-invitation/:token',
        },
        {
          Component: PostLoginPage,
          errorElement: <RouterErrorPage />,
          handle: {
            hidden: true,
            requiredPermissions: [],
            requiresUserProfile: false,
            title: t`Post Login`,
          },
          path: '/post-login',
        },
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
              { command_name: CaseDbCommandName.CaseDbUploadCasesCommand, permission_type: CaseDbPermissionType.EXECUTE },
            ],
            requiresUserProfile: true,
            title: t`Upload`,
          },
          path: '/upload',
        },
        {
          children: [
            {
              // eslint-disable-next-line @eslint-react/component-hook-factories
              Component: () => <AdminPage />,
              errorElement: <RouterErrorPage />,
              handle: {
                disabled: false,
                requiredPermissions: [],
                requiresUserProfile: true,
                title: t`Management`,
              },
              index: true,
              path: '/management',
            },
            ...adminRoutes,
          ],
          errorElement: <RouterErrorPage />,
          handle: {
            disabled: false,
            requiredPermissions: [],
            requirePermissionForChildRoute: true,
            requiresUserProfile: true,
            title: t`Management`,
          },
          path: '/management',
        },
      ],
      Component: RouterRoot,
      errorElement: <RouterErrorPage />,
      handle: {
        icon: <HomeIcon />,
        requiredPermissions: [],
        requiresUserProfile: true,
        root: true,
        title: t`Home`,
      },
      path: '/',
    },

  ];
};
