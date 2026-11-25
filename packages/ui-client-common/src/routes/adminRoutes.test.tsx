import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import {
  describe,
  expect,
  it,
} from 'vitest';

import type {
  MyIndexRouteObject,
  MyNonIndexRouteObject,
} from '../models/react-router.models';
import { IdentifierIssuersAdminPage } from '../pages/IdentifierIssuersAdminPage';
import { OrganizationAdminPoliciesAdminPage } from '../pages/OrganizationAdminPoliciesAdminPage';
import { OrganizationContactsAdminPage } from '../pages/OrganizationContactsAdminPage';
import { OrganizationsAdminPage } from '../pages/OrganizationsAdminPage';
import { OrganizationSitesAdminPage } from '../pages/OrganizationSitesAdminPage';
import { OutagesAdminPage } from '../pages/OutagesAdminPage';
import { UserInvitationsAdminPage } from '../pages/UserInvitationsAdminPage';
import { UsersAdminPage } from '../pages/UsersAdminPage';

import { createAdminRoutes } from './adminRoutes';

type TestRoute = MyIndexRouteObject | MyNonIndexRouteObject;

const findRoute = (routes: TestRoute[], path: string): TestRoute => {
  const route = routes.find((candidate) => candidate.path === path);
  if (!route) {
    throw new Error(`Route ${path} not found`);
  }
  return route;
};

const getChildren = (route: TestRoute): TestRoute[] => ('children' in route ? route.children ?? [] : []);

const READ_ORGANIZATION = { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ };
const READ_USER = { command_name: CommonDbCommandName.UserCrudCommand, permission_type: CommonDbPermissionType.READ };

describe('createAdminRoutes', () => {
  it('creates the admin routes in order', () => {
    const routes = createAdminRoutes();

    expect(routes.map((route) => route.path)).toEqual([
      '/management/organizations',
      '/management/users',
      '/management/user-invitations',
      '/management/organization-admin-policies',
      '/management/identifier-issuers',
      '/management/outages',
    ]);
  });

  it('creates nested organization site and contact routes', () => {
    const routes = createAdminRoutes();
    const organizations = findRoute(routes, '/management/organizations');
    const sites = findRoute(getChildren(organizations), '/management/organizations/:organizationId/sites');

    expect(getChildren(sites).map((route) => route.path)).toEqual([
      '/management/organizations/:organizationId/sites',
      '/management/organizations/:organizationId/sites/:siteId/contacts',
    ]);
    expect(getChildren(sites)[0]?.Component).toBe(OrganizationSitesAdminPage);
    expect(getChildren(sites)[1]?.Component).toBe(OrganizationContactsAdminPage);
  });

  it('uses the default users component when none is provided', () => {
    const users = findRoute(createAdminRoutes(), '/management/users');

    expect(getChildren(users)[0]?.Component).toBe(UsersAdminPage);
  });

  it('uses the provided users component', () => {
    const CustomUsers = (): null => null;
    const users = findRoute(createAdminRoutes({ usersComponent: CustomUsers }), '/management/users');

    expect(getChildren(users)[0]?.Component).toBe(CustomUsers);
  });

  it('appends the provided users route children after the users index route', () => {
    const users = findRoute(
      createAdminRoutes({ usersRouteChildren: [{ path: '/management/users/custom' }] }),
      '/management/users',
    );

    expect(getChildren(users).map((route) => route.path)).toEqual([
      '/management/users',
      '/management/users/custom',
    ]);
  });

  it('keeps only the users index route when no users route children are provided', () => {
    const users = findRoute(createAdminRoutes({ usersRouteChildren: [] }), '/management/users');

    expect(getChildren(users)).toHaveLength(1);
  });

  it('maps each admin page to its component and required permissions', () => {
    const routes = createAdminRoutes();

    expect(getChildren(findRoute(routes, '/management/organizations'))[0]?.Component).toBe(OrganizationsAdminPage);
    expect(getChildren(findRoute(routes, '/management/organizations'))[0]?.handle?.requiredPermissions).toEqual([READ_ORGANIZATION]);
    expect(getChildren(findRoute(routes, '/management/users'))[0]?.handle?.requiredPermissions).toEqual([READ_USER, READ_ORGANIZATION]);
    expect(findRoute(routes, '/management/user-invitations').Component).toBe(UserInvitationsAdminPage);
    expect(findRoute(routes, '/management/organization-admin-policies').Component).toBe(OrganizationAdminPoliciesAdminPage);
    expect(findRoute(routes, '/management/identifier-issuers').Component).toBe(IdentifierIssuersAdminPage);
    expect(findRoute(routes, '/management/outages').Component).toBe(OutagesAdminPage);
    expect(findRoute(routes, '/management/outages').handle?.requiredPermissions).toEqual([]);
  });

  it('requires a user profile on every admin route', () => {
    const routes = createAdminRoutes();
    const leafRoutes = routes.flatMap((route) => [route, ...getChildren(route)]);

    expect(leafRoutes.map((route) => route.handle?.requiresUserProfile)).toEqual(leafRoutes.map(() => true));
  });
});
