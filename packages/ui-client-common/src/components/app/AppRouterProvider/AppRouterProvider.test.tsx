import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';

import { RouterService } from '../../../classes/services/RouterService';
import { renderComponent } from '../../../test/lib';

import { AppRouterProvider } from './AppRouterProvider';

describe('AppRouterProvider', () => {
  it('renders the route matching the current location of the registered router', async () => {
    container.registerInstance(
      RouterService,
      new RouterService({
        adminRoutes: [],
        homePageComponent: () => (
          <div>
            {'Home page'}
          </div>
        ),
        routes: [
          {
            element: (
              <div>
                {'Routed content'}
              </div>
            ),
            path: '/',
          },
        ],
      }),
    );

    const screen = await renderComponent(
      <AppRouterProvider />,
    );

    await expect.element(screen.getByText('Routed content')).toBeInTheDocument();
  });
});
