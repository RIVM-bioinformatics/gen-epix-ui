import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';

import { AuthenticationService } from '../../classes/services/AuthenticationService';
import { RouterService } from '../../classes/services/RouterService';
import { renderComponent } from '../../test/lib';

import { RouterErrorPage } from './RouterErrorPage';

const renderRouterErrorPage = async (loader: () => never) => {
  const router = createMemoryRouter([
    {
      element: (
        <div>
          {'Route content'}
        </div>
      ),
      errorElement: <RouterErrorPage />,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      HydrateFallback: () => <div />,
      loader,
      path: '/',
    },
  ], { initialEntries: ['/'] });
  return renderComponent(
    <RouterProvider router={router} />,
  );
};

describe('RouterErrorPage', () => {
  afterEach(() => {
    container.resolve(AuthenticationService).authContextProps = undefined;
    sessionStorage.clear();
  });

  it('renders the error page title and the generic error for an unexpected error', async () => {
    const screen = await renderRouterErrorPage(() => {
      throw new Error('Route loader failed');
    });

    await expect.poll(() => document.title).toContain('Error');
    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.element(screen.getByText(/Error message: Route loader failed/)).toBeVisible();
  });

  it('renders the not found message for a route error response', async () => {
    container.registerInstance(RouterService, new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [],
    }));
    const screen = await renderRouterErrorPage(() => {
      const notFoundResponse: unknown = Response.json({}, { status: 404 });
      throw notFoundResponse;
    });

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Not found.' })).toBeVisible();
  });
});
