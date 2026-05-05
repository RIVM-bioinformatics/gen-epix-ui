import { createBrowserRouter } from 'react-router-dom';
import { t } from 'i18next';

import { createRoutes } from '../../../routes';
import { HmrUtil } from '../../../utils/HmrUtil';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';


export class RouterManager {
  public static get instance(): RouterManager {
    RouterManager.__instance = HmrUtil.getHmrSingleton('routerManager', RouterManager.__instance, () => new RouterManager());
    return RouterManager.__instance;
  }

  private static __instance: RouterManager;

  public readonly router: ReturnType<typeof createBrowserRouter>;

  public readonly routes: MyNonIndexRouteObject[];

  private constructor() {
    this.routes = createRoutes(t);
    this.router = createBrowserRouter(this.routes);
  }

}
