import type { ReactElement } from 'react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import type {
  MyIndexRouteObject,
  MyNonIndexRouteObject,
} from '../models/react-router.models';
import { AdminPage } from '../pages/AdminPage';
import { PostLoginPage } from '../pages/PostLoginPage';
import { RouterErrorPage } from '../pages/RouterErrorPage';

import { createRoutes } from './routes';

type TestRoute = MyIndexRouteObject | MyNonIndexRouteObject;

const findRoute = (routes: TestRoute[], path: string): TestRoute => {
  const route = routes.find((candidate) => candidate.path === path);
  if (!route) {
    throw new Error(`Route ${path} not found`);
  }
  return route;
};

const getChildren = (route: TestRoute): TestRoute[] => ('children' in route ? route.children ?? [] : []);

const getRootRoute = (routes: TestRoute[]): TestRoute => findRoute(routes, '/');

const getManagementRoute = (routes: TestRoute[]): TestRoute => findRoute(getChildren(getRootRoute(routes)), '/management');

describe('createRoutes', () => {
  it('creates the top-level routes with the root route wrapping the authenticated pages', () => {
    const routes = createRoutes();

    expect(routes.map((route) => route.path)).toEqual(['/post-logout', '/']);
    expect(getChildren(getRootRoute(routes)).map((route) => route.path)).toEqual([
      '/accept-invitation/:token',
      '/post-login',
      '/management',
    ]);
  });

  it('marks the root route as root and requires a user profile', () => {
    const root = getRootRoute(createRoutes());

    expect(root.handle?.root).toBe(true);
    expect(root.handle?.requiresUserProfile).toBe(true);
  });

  it('keeps the post-logout, accept-invitation and post-login routes free of user profile requirements', () => {
    const routes = createRoutes();
    const postLogout = findRoute(routes, '/post-logout');
    const postLogin = findRoute(getChildren(getRootRoute(routes)), '/post-login');

    expect(postLogout.handle?.requiresUserProfile).toBe(false);
    expect(postLogin.handle?.requiresUserProfile).toBe(false);
    expect(postLogin.Component).toBe(PostLoginPage);
  });

  it('uses the default admin routes when none are provided', () => {
    const management = getManagementRoute(createRoutes());

    expect(getChildren(management).map((route) => route.path)).toEqual([
      '/management',
      '/management/organizations',
      '/management/users',
      '/management/user-invitations',
      '/management/organization-admin-policies',
      '/management/identifier-issuers',
      '/management/outages',
    ]);
  });

  it('uses the provided admin routes instead of the default ones', () => {
    const management = getManagementRoute(createRoutes({
      adminRoutes: [{ path: '/management/custom' }],
    }));

    expect(getChildren(management).map((route) => route.path)).toEqual([
      '/management',
      '/management/custom',
    ]);
  });

  it('inserts the provided root children before the management route', () => {
    const routes = createRoutes({
      rootChildren: [{ path: '/custom-root-child' }],
    });

    expect(getChildren(getRootRoute(routes)).map((route) => route.path)).toEqual([
      '/accept-invitation/:token',
      '/post-login',
      '/custom-root-child',
      '/management',
    ]);
  });

  it('renders the admin page on the management index route', () => {
    const managementIndex = findRoute(getChildren(getManagementRoute(createRoutes())), '/management');
    const renderManagementIndex = managementIndex.Component as () => ReactElement;

    expect(renderManagementIndex().type).toBe(AdminPage);
    expect(managementIndex.errorElement).toBeDefined();
  });

  it('uses the router error page as error element for the root route', () => {
    const root = getRootRoute(createRoutes());

    expect(root.errorElement).toEqual(
      <RouterErrorPage />,
    );
  });
});
