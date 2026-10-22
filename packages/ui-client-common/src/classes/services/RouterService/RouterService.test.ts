import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createElement } from 'react';
import type { ReactElement } from 'react';

import type { MyNonIndexRouteObject } from '../../../models/react-router.models';

import { RouterService } from './RouterService';

const createBrowserRouterMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  createBrowserRouter: createBrowserRouterMock,
}));

const createRoute = (path: string): MyNonIndexRouteObject => ({
  handle: {
    requiredPermissions: [],
    requiresUserProfile: false,
    title: path,
  },
  path,
});

const HomePage = (): ReactElement => createElement('div');

describe('RouterService', () => {
  beforeEach(() => {
    createBrowserRouterMock.mockReset();
    createBrowserRouterMock.mockReturnValue({});
  });

  it('returns array-based route configuration and the home page component', () => {
    const routes = [createRoute('/')];
    const adminRoutes = [createRoute('/admin')];
    const service = new RouterService({
      adminRoutes,
      homePageComponent: HomePage,
      routes,
    });

    expect(service.routes).toBe(routes);
    expect(service.routes).toBe(routes);
    expect(service.adminRoutes).toBe(adminRoutes);
    expect(service.adminRoutes).toBe(adminRoutes);
    expect(service.homePageComponent).toBe(HomePage);
    expect(createBrowserRouterMock).not.toHaveBeenCalled();
  });

  it('evaluates route factories lazily and caches their results', () => {
    const routes = [createRoute('/')];
    const adminRoutes = [createRoute('/admin')];
    const routesFactory = vi.fn(() => routes);
    const adminRoutesFactory = vi.fn(() => adminRoutes);
    const service = new RouterService({
      adminRoutes: adminRoutesFactory,
      homePageComponent: HomePage,
      routes: routesFactory,
    });

    expect(routesFactory).not.toHaveBeenCalled();
    expect(adminRoutesFactory).not.toHaveBeenCalled();

    expect(service.routes).toBe(routes);
    expect(service.routes).toBe(routes);
    expect(service.adminRoutes).toBe(adminRoutes);
    expect(service.adminRoutes).toBe(adminRoutes);
    expect(routesFactory).toHaveBeenCalledOnce();
    expect(adminRoutesFactory).toHaveBeenCalledOnce();
  });

  it('creates the browser router lazily once from the cached routes', () => {
    const routes = [createRoute('/')];
    const service = new RouterService({
      adminRoutes: [],
      homePageComponent: HomePage,
      routes,
    });

    const router = service.router;

    expect(router).toBe(service.router);
    expect(createBrowserRouterMock).toHaveBeenCalledExactlyOnceWith(routes);
  });
});
