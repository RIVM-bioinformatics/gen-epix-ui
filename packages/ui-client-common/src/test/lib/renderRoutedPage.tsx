import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';

import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { RouterService } from '../../classes/services/RouterService';
import type { ConfigBase } from '../../models/config.models';

import { renderComponent } from './render';

const ROUTE_TITLE = 'Test page';

/**
 * Renders a page element at the route `path` inside a real router, navigated to `url`, with the given API permissions granted to the user.
 * Use `path` with route params (e.g. `/sites/:siteId`) and a matching `url` when the page reads `useParams`.
 */
export const renderRoutedPage = async (
  element: ReactNode,
  {
    path = '/',
    permissions = [],
    url = path,
  }: {
    readonly path?: string;
    readonly permissions?: CommonDbApiPermission[];
    readonly url?: string;
  } = {},
) => {
  container.resolve(AuthorizationService).apiPermissions = permissions;
  window.history.replaceState(null, '', url);
  const routerService = new RouterService({
    adminRoutes: [],
    homePageComponent: () => (
      <div>
        {'Home page'}
      </div>
    ),
    routes: [
      {
        element: (
          <div style={{ height: 800, width: 1200 }}>
            {element}
          </div>
        ),
        handle: {
          requiredPermissions: [],
          requiresUserProfile: false,
          title: ROUTE_TITLE,
        },
        path,
      },
    ],
  });
  container.registerInstance(RouterService, routerService);
  return await renderComponent(
    <RouterProvider router={routerService.router} />,
    {
      configure: (config: ConfigBase) => {
        config.ApplicationHeader = () => <div />;
        config.createFooter = () => ({ sections: [] });
        config.enablePageEvents = false;
      },
    },
  );
};
