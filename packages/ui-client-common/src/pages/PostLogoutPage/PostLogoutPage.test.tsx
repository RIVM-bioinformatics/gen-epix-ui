import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';

import { RouterService } from '../../classes/services/RouterService';
import { renderComponent } from '../../test/lib';

import { PostLogoutPage } from './PostLogoutPage';

describe('PostLogoutPage', () => {
  beforeEach(() => {
    container.registerInstance(RouterService, new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [
        { element: <div />, path: '/' },
        { element: <PostLogoutPage />, path: '/post-logout' },
      ],
    }));
    window.history.replaceState(null, '', '/post-logout');
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('sets the logged out document title and shows the logout message', async () => {
    const screen = await renderComponent(
      <PostLogoutPage />,
    );

    await expect.poll(() => document.title).toContain('Logged out');
    await expect.element(screen.getByText('You have been logged out. You may close this window or log in again.')).toBeVisible();
  });

  it('navigates to the home page when the log in again button is clicked', async () => {
    const screen = await renderComponent(
      <PostLogoutPage />,
    );

    await screen.getByRole('button', { name: 'Log in again' }).click();

    await expect.poll(() => window.location.pathname).toBe('/');
  });
});
