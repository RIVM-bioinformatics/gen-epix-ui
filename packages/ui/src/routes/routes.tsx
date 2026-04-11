/* eslint-disable @typescript-eslint/naming-convention */
import HomeIcon from '@mui/icons-material/Home';
import type { TFunction } from 'i18next';

import {
  CommandName,
  PermissionType,
} from '../api';
import type { MyNonIndexRouteObject } from '../models/reactRouter';
import { AcceptInvitationPage } from '../pages/AcceptInvitationPage';
import { AdminPage } from '../pages/AdminPage';
import { CasesDetailPage } from '../pages/CasesDetailPage';
import { CasesPage } from '../pages/CasesPage';
import { EventsDetailPage } from '../pages/EventsDetailPage';
import { EventsPage } from '../pages/EventsPage';
import { PostLoginPage } from '../pages/PostLoginPage';
import { PostLogoutPage } from '../pages/PostLogoutPage';
import { RouterErrorPage } from '../pages/RouterErrorPage';
import { TrendsPage } from '../pages/TrendsPage';
import { UploadPage } from '../pages/UploadPage';
import { RouterRoot } from '../components/app/RouterRoot';

import { createAdminRoutes } from './adminRoutes';

export const createRoutes = (t: TFunction<'translation', undefined>): MyNonIndexRouteObject[] => {
  const adminRoutes = createAdminRoutes(t);

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
                  { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.RetrieveCaseStatsCommand, permission_type: PermissionType.EXECUTE },
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
                  { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.ConceptSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.RetrieveCasesByIdCommand, permission_type: PermissionType.EXECUTE },
                  { command_name: CommandName.RetrieveCasesByQueryCommand, permission_type: PermissionType.EXECUTE },
                  { command_name: CommandName.RetrievePhylogeneticTreeByCasesCommand, permission_type: PermissionType.EXECUTE },
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
                  { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseSetStatusCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseSetCategoryCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.RetrieveCaseStatsCommand, permission_type: PermissionType.EXECUTE },
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
                  { command_name: CommandName.CaseSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.ConceptSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.RetrieveCasesByIdCommand, permission_type: PermissionType.EXECUTE },
                  { command_name: CommandName.RetrieveCasesByQueryCommand, permission_type: PermissionType.EXECUTE },
                  { command_name: CommandName.RetrievePhylogeneticTreeByCasesCommand, permission_type: PermissionType.EXECUTE },
                  { command_name: CommandName.RetrievePhylogeneticTreeByCasesCommand, permission_type: PermissionType.EXECUTE },
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
              { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
              { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
              { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
              { command_name: CommandName.RetrieveProtocolsCommand, permission_type: PermissionType.EXECUTE },
              { command_name: CommandName.CreateFileForReadSetCommand, permission_type: PermissionType.EXECUTE },
              { command_name: CommandName.CreateFileForSeqCommand, permission_type: PermissionType.EXECUTE },
              { command_name: CommandName.UploadCasesCommand, permission_type: PermissionType.EXECUTE },
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
              Component: () => <AdminPage routes={adminRoutes} />,
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
