/* eslint-disable @typescript-eslint/naming-convention */
import HomeIcon from '@mui/icons-material/Home';

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

import { adminRoutes } from './adminRoutes';


export const routes: MyNonIndexRouteObject[] = [
  {
    path: '/post-logout',
    Component: () => <PostLogoutPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'PostLogout',
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
      titleKey: 'Home',
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
          titleKey: 'AcceptInvitation',
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
          titleKey: 'PostLogin',
          hidden: true,
          requiredPermissions: [],
          requiresUserProfile: false,
        },
      },
      {
        path: '/cases',
        errorElement: <RouterErrorPage />,
        handle: {
          titleKey: 'Cases',
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
              titleKey: 'Cases',
              hidden: false,
              requiredPermissions: [
                { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.RetrieveCaseTypeStatsCommand, permission_type: PermissionType.EXECUTE },
              ],
              requiresUserProfile: true,
            },
          },
          {
            path: '/cases/:slug/:caseTypeId',
            Component: () => <CasesDetailPage />,
            errorElement: <RouterErrorPage />,
            handle: {
              titleKey: 'Case type',
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
          titleKey: 'Events',
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
              titleKey: 'Events',
              hidden: false,
              requiredPermissions: [
                { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseSetCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseSetStatusCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseSetCategoryCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.RetrieveCaseSetStatsCommand, permission_type: PermissionType.EXECUTE },
              ],
              requiresUserProfile: true,
            },
          },
          {
            path: '/events/:slug/:caseSetId',
            Component: () => <EventsDetailPage />,
            errorElement: <RouterErrorPage />,
            handle: {
              titleKey: 'Event',
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
          titleKey: 'Trends',
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
          titleKey: 'Upload',
          requiredPermissions: [
            { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeColCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.RetrieveSequencingProtocolsCommand, permission_type: PermissionType.EXECUTE },
            { command_name: CommandName.RetrieveAssemblyProtocolsCommand, permission_type: PermissionType.EXECUTE },
            { command_name: CommandName.ValidateCasesCommand, permission_type: PermissionType.EXECUTE },
            { command_name: CommandName.ValidateCasesCommand, permission_type: PermissionType.EXECUTE },
            { command_name: CommandName.CreateSeqsForCasesCommand, permission_type: PermissionType.EXECUTE },
            { command_name: CommandName.CreateReadSetsForCasesCommand, permission_type: PermissionType.EXECUTE },
            { command_name: CommandName.CreateFileForReadSetCommand, permission_type: PermissionType.EXECUTE },
            { command_name: CommandName.CreateFileForReadSetCommand, permission_type: PermissionType.EXECUTE },
            // !FIXME
            // { command_name: CommandName.CreateCasesCommand, permission_type: PermissionType.EXECUTE },
          ],
          requiresUserProfile: true,
        },
      },
      {
        path: '/management',
        errorElement: <RouterErrorPage />,
        handle: {
          titleKey: 'Management',
          disabled: false,
          requiredPermissions: [],
          requiresUserProfile: true,
          requirePermissionForChildRoute: true,
        },
        children: [
          {
            path: '/management',
            index: true,
            Component: () => <AdminPage />,
            errorElement: <RouterErrorPage />,
            handle: {
              titleKey: 'Management',
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
