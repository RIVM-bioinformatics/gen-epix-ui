import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { RouterProvider } from 'react-router-dom';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { RouterService } from '../../classes/services/RouterService';
import { ADMIN_PAGE_CATEGORY } from '../../models/admin.models';
import type {
  MyHandle,
  MyNonIndexRouteObject,
} from '../../models/react-router.models';
import { renderComponent } from '../../test/lib';

import { AdminPage } from './AdminPage';

const ORGANIZATION_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.OrganizationCrudCommand,
  permission_type: CommonDbPermissionType.READ,
};

const SITE_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.SiteCrudCommand,
  permission_type: CommonDbPermissionType.READ,
};

const createHandle = (overrides: Partial<MyHandle<CommonDbApiPermission>> = {}): MyHandle<CommonDbApiPermission> => ({
  requiredPermissions: [],
  requiresUserProfile: false,
  title: 'Title',
  ...overrides,
});

const createAdminRoute = ({
  category = ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
  hidden,
  path,
  requiredPermissions = [],
  title,
}: {
  category?: ADMIN_PAGE_CATEGORY;
  hidden?: boolean;
  path: string;
  requiredPermissions?: CommonDbApiPermission[];
  title: string;
}): MyNonIndexRouteObject => ({
  children: [
    {
      element: <div />,
      handle: createHandle({
        category,
        hidden,
        requiredPermissions,
        subTitle: `${title} subtitle`,
        title,
      }),
      index: true,
      path,
    },
  ],
  handle: createHandle({ title }),
  path,
});

const createLeafAdminRoute = (): MyNonIndexRouteObject => ({
  element: <div />,
  handle: createHandle({
    category: ADMIN_PAGE_CATEGORY.HELPERS,
    requiredPermissions: [],
    subTitle: 'Leaf subtitle',
    title: 'Leaf card',
  }),
  path: '/management/leaf',
});

const renderAdminPage = async (pathname: string, adminRoutes: MyNonIndexRouteObject[]) => {
  window.history.replaceState(null, '', pathname);
  const routerService = new RouterService({
    adminRoutes,
    homePageComponent: () => <div />,
    routes: [
      {
        children: [
          {
            element: (
              <div>
                {'Child page'}
              </div>
            ),
            handle: createHandle({ title: 'Child' }),
            path: '/management/child',
          },
        ],
        element: <AdminPage />,
        handle: createHandle({ title: 'Management' }),
        path: '/management',
      },
      {
        element: <div />,
        handle: createHandle({ title: 'Home' }),
        path: '/',
      },
    ],
  });
  container.registerInstance(RouterService, routerService);
  const navigateSpy = vi.spyOn(routerService.router, 'navigate').mockResolvedValue(undefined);
  const screen = await renderComponent(
    <RouterProvider router={routerService.router} />,
  );
  return { navigateSpy, screen };
};

const getCategoryHeadings = () => Array.from(document.querySelectorAll('[data-testid="AdminPage"] h2.MuiTypography-h3')).map(heading => heading.textContent);

describe('AdminPage', () => {
  beforeEach(() => {
    container.resolve(AuthorizationService).apiPermissions = [];
  });

  afterEach(() => {
    container.resolve(AuthorizationService).apiPermissions = [];
    window.history.replaceState(null, '', '/');
  });

  it('renders only the cards the user has permission for and omits hidden cards and empty categories', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ORGANIZATION_PERMISSION];
    const { screen } = await renderAdminPage('/management', [
      createAdminRoute({ path: '/management/organizations', requiredPermissions: [ORGANIZATION_PERMISSION], title: 'Visible organizations' }),
      createAdminRoute({ hidden: true, path: '/management/hidden', title: 'Hidden card' }),
      createAdminRoute({ category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA, path: '/management/sites', requiredPermissions: [SITE_PERMISSION], title: 'Protected sites' }),
    ]);

    await expect.element(screen.getByText('Visible organizations')).toBeVisible();
    expect(screen.getByText('Hidden card').query()).toBeNull();
    expect(screen.getByText('Protected sites').query()).toBeNull();
    expect(getCategoryHeadings()).toEqual(['Users and organizations']);
  });

  it('renders the categories in a fixed order and includes cards without required permissions', async () => {
    const { screen } = await renderAdminPage('/management', [
      createLeafAdminRoute(),
      createAdminRoute({ category: ADMIN_PAGE_CATEGORY.SYSTEM, path: '/management/system', title: 'System card' }),
      createAdminRoute({ path: '/management/users', title: 'Users card' }),
    ]);

    await expect.element(screen.getByText('Leaf card')).toBeVisible();
    await expect.element(screen.getByText('System card')).toBeVisible();
    await expect.element(screen.getByText('Users card')).toBeVisible();
    expect(getCategoryHeadings()).toEqual(['Users and organizations', 'System', 'Helpers']);
  });

  it('navigates to the card path when a card is clicked', async () => {
    const { navigateSpy, screen } = await renderAdminPage('/management', [
      createLeafAdminRoute(),
    ]);

    await screen.getByText('Leaf card').click();

    await expect.poll(() => navigateSpy.mock.calls.length).toBe(1);
    expect(navigateSpy).toHaveBeenCalledWith('/management/leaf');
  });

  it('renders the nested route through the outlet instead of the card grid when a sub path is active', async () => {
    const { screen } = await renderAdminPage('/management/child', [
      createLeafAdminRoute(),
    ]);

    await expect.element(screen.getByText('Child page')).toBeVisible();
    expect(screen.getByText('Leaf card').query()).toBeNull();
    expect(getCategoryHeadings()).toEqual([]);
  });
});
