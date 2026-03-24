import { createBrowserRouter } from 'react-router-dom';
import { t } from 'i18next';

import { createRoutes } from '../../../routes';
import { WindowManager } from '../WindowManager';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';


export class RouterManager {
  public readonly router: ReturnType<typeof createBrowserRouter>;
  public readonly routes: MyNonIndexRouteObject[];

  private constructor() {
    this.routes = createRoutes(t);
    this.router = createBrowserRouter(this.routes);
  }

  public static get instance(): RouterManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.route = WindowManager.instance.window.managers.route || new RouterManager();
    return WindowManager.instance.window.managers.route;
  }

}
