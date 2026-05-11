/* eslint-disable @typescript-eslint/naming-convention */
import HomeIcon from '@mui/icons-material/Home';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { t } from 'i18next';

import { RouterRoot } from '../components/app/RouterRoot';
import type {
  MyIndexRouteObject,
  MyNonIndexRouteObject,
} from '../models/reactRouter';
import { AcceptInvitationPage } from '../pages/AcceptInvitationPage';
import { AdminPage } from '../pages/AdminPage';
import { PostLoginPage } from '../pages/PostLoginPage';
import { PostLogoutPage } from '../pages/PostLogoutPage';
import { RouterErrorPage } from '../pages/RouterErrorPage';

import { createAdminRoutes } from './adminRoutes';

type CreateRoutesOptions<TExtraPermission = never> = {
  adminRoutes?: MyNonIndexRouteObject<CommonDbApiPermission | TExtraPermission>[];
  rootChildren?: Array<
    MyIndexRouteObject<CommonDbApiPermission | TExtraPermission>
    | MyNonIndexRouteObject<CommonDbApiPermission | TExtraPermission>
  >;
};

export const createRoutes = <TExtraPermission = never>(
  options: CreateRoutesOptions<TExtraPermission> = {},
): MyNonIndexRouteObject<CommonDbApiPermission | TExtraPermission>[] => {
  const adminRoutes = options.adminRoutes ?? createAdminRoutes<TExtraPermission>();
  const rootChildren = options.rootChildren ?? [];

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
        ...rootChildren,
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
