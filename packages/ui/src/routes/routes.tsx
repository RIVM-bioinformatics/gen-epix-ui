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
      path: '/post-logout',
      Component: () => <PostLogoutPage />,
      errorElement: <RouterErrorPage />,
      handle: {
        title: t`Post Logout`,
        hidden: true,
        requiredPermissions: [],
        requiresUserProfile: false,
      },
    },
    {
      path: '/',
      Component: () => <RouterRoot />,
      errorElement: <RouterErrorPage />,
      handle: {
        root: true,
        title: t`Home`,
        icon: <HomeIcon />,
        requiredPermissions: [],
        requiresUserProfile: true,
      },
      children: [
        {
          path: '/accept-invitation/:token',
          Component: () => <AcceptInvitationPage />,
          errorElement: <RouterErrorPage />,
          handle: {
            title: t`Accept Invitation`,
            hidden: true,
            requiredPermissions: [],
            requiresUserProfile: false,
          },
        },
        {
          path: '/post-login',
          Component: () => <PostLoginPage />,
          errorElement: <RouterErrorPage />,
          handle: {
            title: t`Post Login`,
            hidden: true,
            requiredPermissions: [],
            requiresUserProfile: false,
          },
        },
        {
          path: '/cases',
          errorElement: <RouterErrorPage />,
          handle: {
            title: t`Cases`,
            hidden: false,
            requiredPermissions: [],
            requiresUserProfile: true,
          },
          children: [
            {
              index: true,
              path: '/cases',
              Component: () => <CasesPage />,
              errorElement: <RouterErrorPage />,
              handle: {
                title: t`Cases`,
                hidden: false,
                requiredPermissions: [
                  { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
                  { command_name: CommandName.RetrieveCaseStatsCommand, permission_type: PermissionType.EXECUTE },
                ],
                requiresUserProfile: true,
              },
            },
            {
              path: '/cases/:slug/:caseTypeId',
              Component: () => <CasesDetailPage />,
              errorElement: <RouterErrorPage />,
              handle: {
                title: t`Case type`,
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
              },
            },
          ],
        },
        {
          path: '/events',
          errorElement: <RouterErrorPage />,
          handle: {
            title: t`Events`,
            hidden: false,
            requiredPermissions: [],
            requiresUserProfile: true,
          },
          children: [
            {
              index: true,
              Component: () => <EventsPage />,
              errorElement: <RouterErrorPage />,
              handle: {
                title: t`Events`,
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
              },
            },
            {
              path: '/events/:slug/:caseSetId',
              Component: () => <EventsDetailPage />,
              errorElement: <RouterErrorPage />,
              handle: {
                title: t`Event`,
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
              },
            },
          ],
        },
        {
          path: '/trends',
          Component: () => <TrendsPage />,
          errorElement: <RouterErrorPage />,
          handle: {
            title: t`Trends`,
            disabled: true,
            requiredPermissions: [],
            requiresUserProfile: true,
          },
        },
        {
          path: '/upload',
          Component: () => <UploadPage />,
          errorElement: <RouterErrorPage />,
          handle: {
            title: t`Upload`,
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
          },
        },
        {
          path: '/management',
          errorElement: <RouterErrorPage />,
          handle: {
            title: t`Management`,
            disabled: false,
            requiredPermissions: [],
            requiresUserProfile: true,
            requirePermissionForChildRoute: true,
          },
          children: [
            {
              path: '/management',
              index: true,
              Component: () => <AdminPage routes={adminRoutes} />,
              errorElement: <RouterErrorPage />,
              handle: {
                title: t`Management`,
                disabled: false,
                requiredPermissions: [],
                requiresUserProfile: true,
              },
            },
            ...adminRoutes,
          ],
        },
      ],
    },

  ];
};
