import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { AuthContextProps } from 'react-oidc-context';
import { AuthContext } from 'react-oidc-context';

import { AuthenticationService } from '../../classes/services/AuthenticationService';
import { RouterService } from '../../classes/services/RouterService';
import type { AuthState } from '../../models/auth.models';
import { renderComponent } from '../../test/lib';

import { PostLoginPage } from './PostLoginPage';

const createAuthContextValue = (state?: Partial<AuthState>) => ({
  user: {
    state,
  },
} as unknown as AuthContextProps);

const renderPostLoginPage = async (state?: Partial<AuthState>) => renderComponent(
  <AuthContext value={createAuthContextValue(state)}>
    <PostLoginPage />
  </AuthContext>,
);

describe('PostLoginPage', () => {
  beforeEach(() => {
    container.registerInstance(RouterService, new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [
        { element: <div />, path: '/' },
        { element: <div />, path: '/cases' },
        { element: <div />, path: '/post-login' },
        { element: <div />, path: '/start-page' },
      ],
    }));
    window.history.replaceState(null, '', '/start-page');
  });

  afterEach(() => {
    container.resolve(AuthenticationService).authContextProps = undefined;
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('sets the logged in document title and renders a progress indicator', async () => {
    const screen = await renderPostLoginPage({ preLoginLocation: { hash: '', pathname: '/cases', search: '' } });

    await expect.poll(() => document.title).toContain('Logged in');
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
  });

  it('navigates to the location that was active before the login, including search and hash', async () => {
    await renderPostLoginPage({
      preLoginLocation: {
        hash: '#details',
        pathname: '/cases',
        search: '?page=2',
      },
    });

    await expect.poll(() => window.location.pathname).toBe('/cases');
    expect(window.location.search).toBe('?page=2');
    expect(window.location.hash).toBe('#details');
  });

  it('navigates to the home page when there is no pre-login location', async () => {
    await renderPostLoginPage({});

    await expect.poll(() => window.location.pathname).toBe('/');
  });

  it('navigates to the home page when the auth state is missing', async () => {
    await renderPostLoginPage(undefined);

    await expect.poll(() => window.location.pathname).toBe('/');
  });

  it('navigates to the home page instead of the post-login page itself', async () => {
    await renderPostLoginPage({ preLoginLocation: { hash: '', pathname: '/post-login', search: '' } });

    await expect.poll(() => window.location.pathname).toBe('/');
  });
});
