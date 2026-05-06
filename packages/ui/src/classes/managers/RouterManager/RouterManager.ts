import type { ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { HmrUtil } from '../../../utils/HmrUtil';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';

type HomePage = () => ReactElement;

export class RouterManager {
  private static __instance: RouterManager;

  public adminRoutes: MyNonIndexRouteObject[];
  public homePageComponent: HomePage;
  public router: ReturnType<typeof createBrowserRouter>;
  public routes: MyNonIndexRouteObject[];

  private constructor() {
  }

  public static getInstance(): RouterManager {
    RouterManager.__instance = HmrUtil.getHmrSingleton('routerManager', RouterManager.__instance, () => new RouterManager());
    return RouterManager.__instance;
  }

  public initialize(kwArgs: {
    adminRoutes: MyNonIndexRouteObject[];
    homePageComponent: HomePage;
    routes: MyNonIndexRouteObject[];
  }): void {
    if (this.routes.length > 0) {
      throw new Error('RouterManager already initialized');
    }
    this.homePageComponent = kwArgs.homePageComponent;
    this.adminRoutes = kwArgs.adminRoutes;
    this.routes = kwArgs.routes;
    this.router = createBrowserRouter(this.routes);
  }
}
