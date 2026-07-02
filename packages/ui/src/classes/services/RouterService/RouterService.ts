import type { ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { HmrUtil } from '../../../utils/HmrUtil';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';

type HomePage = () => ReactElement;

export class RouterService {
  private static __instance: RouterService;

  public adminRoutes: MyNonIndexRouteObject[] = [];
  public homePageComponent: HomePage;
  public router: ReturnType<typeof createBrowserRouter>;
  public routes: MyNonIndexRouteObject[] = [];

  private constructor() {
  }

  public static getInstance(): RouterService {
    RouterService.__instance = HmrUtil.getHmrSingleton('routerService', RouterService.__instance, () => new RouterService());
    return RouterService.__instance;
  }

  public initialize(kwArgs: {
    adminRoutes: MyNonIndexRouteObject[];
    homePageComponent: HomePage;
    routes: MyNonIndexRouteObject[];
  }): void {
    if (this.routes.length > 0) {
      throw new Error('RouterService already initialized');
    }
    this.homePageComponent = kwArgs.homePageComponent;
    this.adminRoutes = kwArgs.adminRoutes;
    this.routes = kwArgs.routes;
    this.router = createBrowserRouter(this.routes);
  }
}
