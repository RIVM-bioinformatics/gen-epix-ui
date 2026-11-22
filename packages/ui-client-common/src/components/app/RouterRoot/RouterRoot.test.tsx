import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { UserManager } from 'oidc-client-ts';
import type {
  CommonDbApiPermission,
  CommonDbIdentityProvider,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import {
  CommonDbAuthProtocol,
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import {
  AuthenticationService,
  createdAtMetaDataKey,
} from '../../../classes/services/AuthenticationService/AuthenticationService';
import { RouterService } from '../../../classes/services/RouterService';
import { oidcStore } from '../../../stores/oidcStore';
import { TEST_API_ORIGIN } from '../../../test/requests/mockApi';
import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { RouterRoot } from './RouterRoot';

const USER: CommonDbUser = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Example user',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const PERMISSIONS: CommonDbApiPermission[] = [
  {
    command_name: CommonDbCommandName.OrganizationCrudCommand,
    permission_type: CommonDbPermissionType.READ,
  },
];

const createProvider = (name: string): CommonDbIdentityProvider => ({
  auth_protocol: CommonDbAuthProtocol.OIDC,
  client_id: `${name}-client`,
  discovery_url: `${TEST_API_ORIGIN}/${name}/.well-known/openid-configuration`,
  issuer: `https://${name}.test.invalid`,
  label: `Provider ${name}`,
  name,
});

const PROVIDER_A = createProvider('idp-a');
const PROVIDER_B = createProvider('idp-b');

// Mocks the identity providers list and the discovery document of each provider; a 500 marks the provider unavailable
const mockIdentityProviders = (providers: CommonDbIdentityProvider[], availability: Record<string, boolean>) => {
  mockApiRequest('GET', '/v1/identity_providers', () => Response.json(providers));
  for (const provider of providers) {
    mockApiRequest('GET', `/${provider.name}/.well-known/openid-configuration`, () => Response.json({}, { status: availability[provider.name] ? 200 : 500 }));
  }
};

const mockAuthenticatedEndpoints = () => {
  mockApiRequest('GET', '/v1/retrieve/outages', () => Response.json([]));
  mockApiRequest('GET', '/v1/user_me', () => Response.json(USER));
  mockApiRequest('GET', '/v1/user_me/permissions', () => Response.json(PERMISSIONS));
};

// Stores a session for the given provider so that the auth provider considers the user signed in
const storeUserSession = (provider: CommonDbIdentityProvider) => {
  sessionStorage.setItem(`oidc.user:${provider.issuer}:${provider.client_id}`, JSON.stringify({
    access_token: 'access-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    id_token: 'id-token',
    profile: { sub: USER.id },
    scope: 'openid',
    session_state: 'session-state',
    token_type: 'Bearer',
  }));
};

const renderRouterRoot = async (initialEntry: string) => {
  const router = createMemoryRouter([
    {
      children: [
        {
          element: (
            <div>
              {'Child content'}
            </div>
          ),
          handle: { requiresUserProfile: true },
          path: 'child',
        },
      ],
      element: <RouterRoot />,
      handle: { requiresUserProfile: true },
      path: '/',
    },
  ], { initialEntries: [initialEntry] });
  return renderComponent(
    <RouterProvider router={router} />,
    {
      configure: (config) => {
        config.consentDialog.getShouldShow = () => false;
      },
    },
  );
};

let unsubscribeAuthenticationGuard: () => void = () => undefined;

beforeEach(() => {
  container.registerInstance(RouterService, new RouterService({
    adminRoutes: [],
    homePageComponent: () => (
      <div>
        {'Home page content'}
      </div>
    ),
    routes: [],
  }));
  // Selecting a provider starts an automatic login when the selection is very recent; the guard marks the selection as stale so no redirect is started
  unsubscribeAuthenticationGuard = container.resolve(AuthenticationService).subscribe((provider) => {
    if (provider) {
      Reflect.defineMetadata(createdAtMetaDataKey, 0, provider);
    }
  });
});

afterEach(() => {
  unsubscribeAuthenticationGuard();
  oidcStore.getState().setConfiguration(undefined);
  AuthenticationService.clearStaleState();
});

describe('RouterRoot', () => {
  it('shows a spinner while the identity providers are loading and then the provider choice', async () => {
    let releaseProviders: () => void = () => undefined;
    const providersReleased = new Promise<void>((resolve) => {
      releaseProviders = resolve;
    });
    mockApiRequest('GET', '/v1/identity_providers', async () => {
      await providersReleased;
      return Response.json([PROVIDER_A, PROVIDER_B]);
    });
    mockApiRequest('GET', '/idp-a/.well-known/openid-configuration', () => Response.json({}));
    mockApiRequest('GET', '/idp-b/.well-known/openid-configuration', () => Response.json({}));

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByRole('status')).toBeInTheDocument();

    releaseProviders();

    await expect.element(screen.getByTestId('ChooseIdentityProviderPage')).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: PROVIDER_A.label })).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: PROVIDER_B.label })).toBeEnabled();
  });

  it('lists the providers and disables the unavailable ones when only some are available', async () => {
    mockIdentityProviders([PROVIDER_A, PROVIDER_B], { 'idp-a': true, 'idp-b': false });

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByText('Some identity providers are currently unavailable.')).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: PROVIDER_A.label })).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: PROVIDER_B.label })).toBeDisabled();
    expect(container.resolve(AuthenticationService).data).toBeUndefined();
  });

  it('shows an error when none of the identity providers are available', async () => {
    mockIdentityProviders([PROVIDER_A, PROVIDER_B], { 'idp-a': false, 'idp-b': false });

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByText('No identity providers are currently available. Please try again later.')).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: PROVIDER_A.label })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: PROVIDER_B.label })).toBeDisabled();
  });

  it('shows the error page when the identity providers response is not a list', async () => {
    mockApiRequest('GET', '/v1/identity_providers', () => Response.json({ unexpected: true }));

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByTestId('ErrorPage')).toBeInTheDocument();
    await expect.element(screen.getByTestId('ChooseIdentityProviderPage')).not.toBeInTheDocument();
  });

  it('shows the error page when the identity providers request fails', async () => {
    mockApiRequest('GET', '/v1/identity_providers', () => Response.json({ detail: 'Server error' }, { status: 500 }));

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByTestId('ErrorPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Gen-EpiX is currently unavailable. Please try again later.')).toBeInTheDocument();
  });

  it('automatically selects the only available identity provider', async () => {
    mockIdentityProviders([PROVIDER_A], { 'idp-a': true });

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByText('You need to login to access this application.')).toBeInTheDocument();
    expect(container.resolve(AuthenticationService).data).toEqual(PROVIDER_A);
  });

  it('clears the selected identity provider when it differs from the available one', async () => {
    mockIdentityProviders([PROVIDER_A, PROVIDER_B], { 'idp-a': true, 'idp-b': true });
    container.resolve(AuthenticationService).next({ ...PROVIDER_A, label: 'Outdated label' });

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByTestId('ChooseIdentityProviderPage')).toBeInTheDocument();
    expect(container.resolve(AuthenticationService).data).toBeUndefined();
  });

  it('clears the selected identity provider when it is not in the available list', async () => {
    mockIdentityProviders([PROVIDER_A, PROVIDER_B], { 'idp-a': true, 'idp-b': true });
    container.resolve(AuthenticationService).next(createProvider('idp-unknown'));

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByTestId('ChooseIdentityProviderPage')).toBeInTheDocument();
    expect(container.resolve(AuthenticationService).data).toBeUndefined();
  });

  it('clears the selected identity provider when it became unavailable', async () => {
    mockIdentityProviders([PROVIDER_A, PROVIDER_B], { 'idp-a': true, 'idp-b': false });
    container.resolve(AuthenticationService).next(PROVIDER_B);

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByTestId('ChooseIdentityProviderPage')).toBeInTheDocument();
    expect(container.resolve(AuthenticationService).data).toBeUndefined();
  });

  it('creates the user manager for the selected identity provider when it matches the available one', async () => {
    mockIdentityProviders([PROVIDER_A, PROVIDER_B], { 'idp-a': true, 'idp-b': true });
    container.resolve(AuthenticationService).next(PROVIDER_A);

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByText('You need to login to access this application.')).toBeInTheDocument();
    expect(container.resolve(WindowService).window.userManager).toBeInstanceOf(UserManager);
    expect(container.resolve(AuthenticationService).data).toEqual(PROVIDER_A);
  });

  it('renders the home page for the root path when authenticated', async () => {
    mockIdentityProviders([PROVIDER_A], { 'idp-a': true });
    mockAuthenticatedEndpoints();
    storeUserSession(PROVIDER_A);
    container.registerInstance(RouterService, new RouterService({
      adminRoutes: [],
      homePageComponent: () => (
        <div>
          {'Home page content'}
        </div>
      ),
      routes: [],
    }));

    const screen = await renderRouterRoot('/');

    await expect.element(screen.getByText('Home page content')).toBeInTheDocument();
    await expect.element(screen.getByText('Child content')).not.toBeInTheDocument();
  });

  it('renders the matching child route when not on the root path and authenticated', async () => {
    mockIdentityProviders([PROVIDER_A], { 'idp-a': true });
    mockAuthenticatedEndpoints();
    storeUserSession(PROVIDER_A);
    container.registerInstance(RouterService, new RouterService({
      adminRoutes: [],
      homePageComponent: () => (
        <div>
          {'Home page content'}
        </div>
      ),
      routes: [],
    }));

    const screen = await renderRouterRoot('/child');

    await expect.element(screen.getByText('Child content')).toBeInTheDocument();
    await expect.element(screen.getByText('Home page content')).not.toBeInTheDocument();
  });
});
