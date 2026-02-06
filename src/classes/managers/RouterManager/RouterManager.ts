import { createBrowserRouter } from 'react-router-dom';

import { routes } from '../../../data/routes';
import { WindowManager } from '../WindowManager';


export class RouterManager {
  public readonly router: ReturnType<typeof createBrowserRouter>;

  private constructor() {
    this.router = createBrowserRouter(routes);
  }

  public static get instance(): RouterManager {
    WindowManager.instance.window.managers.route = WindowManager.instance.window.managers.route || new RouterManager();
    return WindowManager.instance.window.managers.route;
  }

}
