import type { ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { HmrUtil } from '../../../utils/HmrUtil';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';

type HomePage = () => ReactElement;
type RoutesFactory = () => MyNonIndexRouteObject[];
type RoutesInput = MyNonIndexRouteObject[] | RoutesFactory;

export class RouterService {
  private static __instance: RouterService;

  public get adminRoutes(): MyNonIndexRouteObject[] {
    if (!this.__adminRoutesFactory) {
      throw new Error('RouterService not initialized');
    }
    this.__adminRoutes ??= this.__adminRoutesFactory();
    return this.__adminRoutes;
  }
  public get homePageComponent(): HomePage {
    if (!this.__homePageComponent) {
      throw new Error('RouterService not initialized');
    }
    return this.__homePageComponent;
  }
  public get router(): ReturnType<typeof createBrowserRouter> {
    if (!this.__router) {
      this.__router = createBrowserRouter(this.routes);
    }
    return this.__router;
  }
  public get routes(): MyNonIndexRouteObject[] {
    if (!this.__routesFactory) {
      throw new Error('RouterService not initialized');
    }
    this.__routes ??= this.__routesFactory();
    return this.__routes;
  }
  private __adminRoutes: MyNonIndexRouteObject[] | null = null;
  private __adminRoutesFactory: null | RoutesFactory = null;

  private __homePageComponent: HomePage | null = null;

  private __router: null | ReturnType<typeof createBrowserRouter> = null;

  private __routes: MyNonIndexRouteObject[] | null = null;

  private __routesFactory: null | RoutesFactory = null;

  private constructor() {
  }

  public static getInstance(): RouterService {
    RouterService.__instance = HmrUtil.getHmrSingleton('routerService', RouterService.__instance, () => new RouterService());
    return RouterService.__instance;
  }

  public initialize(kwArgs: {
    adminRoutes: RoutesInput;
    homePageComponent: HomePage;
    routes: RoutesInput;
  }): void {
    if (this.__routesFactory) {
      throw new Error('RouterService already initialized');
    }
    this.__homePageComponent = kwArgs.homePageComponent;
    this.__adminRoutesFactory = this.createRoutesFactory(kwArgs.adminRoutes);
    this.__routesFactory = this.createRoutesFactory(kwArgs.routes);
  }

  private createRoutesFactory(routes: RoutesInput): RoutesFactory {
    if (typeof routes === 'function') {
      return routes;
    }
    return () => routes;
  }
}
