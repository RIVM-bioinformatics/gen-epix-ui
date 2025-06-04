import { createBrowserRouter } from 'react-router-dom';

import { routes } from '../../../data/routes';

export class RouterManager {
  private static __instance: RouterManager;
  public readonly router: ReturnType<typeof createBrowserRouter>;

  private constructor() {
    this.router = createBrowserRouter(routes);
  }

  public static get instance(): RouterManager {
    RouterManager.__instance = RouterManager.__instance || new RouterManager();
    return RouterManager.__instance;
  }
}
