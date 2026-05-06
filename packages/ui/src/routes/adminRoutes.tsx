/* eslint-disable @typescript-eslint/naming-convention */
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import { t } from 'i18next';

import { ADMIN_PAGE_CATEGORY } from '../models/admin';
import type { MyNonIndexRouteObject } from '../models/reactRouter';
import { IdentifierIssuersAdminPage } from '../pages/IdentifierIssuersAdminPage';
import { OrganizationAdminPoliciesAdminPage } from '../pages/OrganizationAdminPoliciesAdminPage';
import { OrganizationContactsAdminPage } from '../pages/OrganizationContactsAdminPage';
import { OrganizationsAdminPage } from '../pages/OrganizationsAdminPage';
import { OrganizationSitesAdminPage } from '../pages/OrganizationSitesAdminPage';
import { OutagesAdminPage } from '../pages/OutagesAdminPage';
import { RouterErrorPage } from '../pages/RouterErrorPage';
import { UserInvitationsAdminPage } from '../pages/UserInvitationsAdminPage';
import { UsersAdminPage } from '../pages/UsersAdminPage';

type CreateAdminRoutesOptions<TExtraPermission = never> = {
  usersRouteChildren?: MyNonIndexRouteObject<CommonDbApiPermission | TExtraPermission>[];
};

export const createAdminRoutes = <TExtraPermission = never>(
  options: CreateAdminRoutesOptions<TExtraPermission> = {},
): MyNonIndexRouteObject<CommonDbApiPermission | TExtraPermission>[] => [
  {
    children: [
      {
        Component: OrganizationsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
          requiredPermissions: [
            { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage your organizations`,
          title: t`Organizations`,
        },
        index: true,
        path: '/management/organizations',
      },
      {
        children: [
          {
            Component: OrganizationSitesAdminPage,
            errorElement: <RouterErrorPage />,
            handle: {
              requiredPermissions: [
                { command_name: CommonDbCommandName.SiteCrudCommand, permission_type: CommonDbPermissionType.READ },
              ],
              requiresUserProfile: true,
              title: t`Organization sites`,
            },
            index: true,
            path: '/management/organizations/:organizationId/sites',
          },
          {
            Component: OrganizationContactsAdminPage,
            errorElement: <RouterErrorPage />,
            handle: {
              requiredPermissions: [
                { command_name: CommonDbCommandName.SiteCrudCommand, permission_type: CommonDbPermissionType.READ },
              ],
              requiresUserProfile: true,
              title: t`Site contacts`,
            },
            path: '/management/organizations/:organizationId/sites/:siteId/contacts',
          },
        ],
        errorElement: <RouterErrorPage />,
        handle: {
          requiredPermissions: [],
          requirePermissionForChildRoute: true,
          requiresUserProfile: true,
          title: t`Organization sites`,
        },
        path: '/management/organizations/:organizationId/sites',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Organizations`,
    },
    path: '/management/organizations',
  },
  {
    children: [
      {
        Component: UsersAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
          requiredPermissions: [
            { command_name: CommonDbCommandName.UserCrudCommand, permission_type: CommonDbPermissionType.READ },
            { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage users`,
          title: t`Users`,
        },
        index: true,
        path: '/management/users',
      },
      ...(options.usersRouteChildren ?? []),
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Users`,
    },
    path: '/management/users',
  },
  {
    Component: UserInvitationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      requiredPermissions: [
        { command_name: CommonDbCommandName.UserInvitationCrudCommand, permission_type: CommonDbPermissionType.READ },
        { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Invite users to your organization`,
      title: t`User invitations`,
    },
    path: '/management/user-invitations',
  },
  {
    Component: OrganizationAdminPoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      requiredPermissions: [
        { command_name: CommonDbCommandName.OrganizationAdminPolicyCrudCommand, permission_type: CommonDbPermissionType.READ },
        { command_name: CommonDbCommandName.UserCrudCommand, permission_type: CommonDbPermissionType.READ },
        { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage organization admin policies`,
      title: t`Organization admin policies`,
    },
    path: '/management/organization-admin-policies',
  },
  {
    Component: IdentifierIssuersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      requiredPermissions: [
        { command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage identifier issuers`,
      title: t`Identifier issuers`,
    },
    path: '/management/identifier-issuers',
  },
  {
    Component: OutagesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.SYSTEM,
      requiredPermissions: [],
      requiresUserProfile: true,
      subTitle: t`Manage outages`,
      title: t`Outages`,
    },
    path: '/management/outages',
  },
];
