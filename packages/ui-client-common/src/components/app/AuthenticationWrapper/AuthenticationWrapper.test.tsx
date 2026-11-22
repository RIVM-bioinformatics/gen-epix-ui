/* eslint-disable @eslint-react/kit/no-multi-comp */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  PropsWithChildren,
  ReactElement,
} from 'react';
import type { AuthContextProps } from 'react-oidc-context';
import { AuthContext } from 'react-oidc-context';
import type { CommonDbIdentityProvider } from '@gen-epix/api-commondb';
import { CommonDbAuthProtocol } from '@gen-epix/api-commondb';
import { useSubscribable } from '@gen-epix/ui-core/hooks/useSubscribable';

import {
  AuthenticationService,
  createdAtMetaDataKey,
} from '../../../classes/services/AuthenticationService/AuthenticationService';
import type { ConfigBase } from '../../../models/config.models';
import { oidcStore } from '../../../stores/oidcStore';
import { renderComponent } from '../../../test/lib';

import { AuthenticationWrapper } from './AuthenticationWrapper';

const IDENTITY_PROVIDER: CommonDbIdentityProvider = {
  auth_protocol: CommonDbAuthProtocol.OIDC,
  issuer: 'https://issuer.test.invalid',
  label: 'Example identity provider',
  name: 'example-idp',
};

const createAuth = (overrides: Record<string, unknown> = {}): AuthContextProps => ({
  activeNavigator: undefined,
  isAuthenticated: false,
  isLoading: false,
  signinRedirect: vi.fn(async () => Promise.resolve()),
  ...overrides,
}) as unknown as AuthContextProps;

// Mirrors RouterRoot, which only renders the wrapper while an identity provider is selected
const IdentityProviderGate = ({ children }: PropsWithChildren): null | ReactElement => {
  const identityProvider = useSubscribable(container.resolve(AuthenticationService));
  return identityProvider ? (
    <>
      {children}
    </>
  ) : null;
};

const renderWithAuth = async (auth: AuthContextProps, configure?: (config: ConfigBase) => void, children: ReactElement = <div>
  {'Protected content'}
</div>) => renderComponent(
  <AuthContext value={auth}>
    <IdentityProviderGate>
      <AuthenticationWrapper>
        {children}
      </AuthenticationWrapper>
    </IdentityProviderGate>
  </AuthContext>,
  { configure },
);

const setIdentityProvider = (isStale: boolean) => {
  const service = container.resolve(AuthenticationService);
  service.next(IDENTITY_PROVIDER);
  if (isStale) {
    // Settings created long ago do not trigger the automatic login
    Reflect.defineMetadata(createdAtMetaDataKey, 0, IDENTITY_PROVIDER);
  }
};

beforeEach(() => {
  // The login element always reads the selected identity provider, so one must be selected
  setIdentityProvider(true);
});

afterEach(() => {
  oidcStore.getState().setConfiguration(undefined);
  AuthenticationService.clearStaleState();
});

describe('AuthenticationWrapper', () => {
  it('shows the redirecting page while the auth context is loading', async () => {
    const screen = await renderWithAuth(createAuth({ isLoading: true }));

    await expect.element(screen.getByText('Redirecting').first()).toBeInTheDocument();
    await expect.element(screen.getByText('You need to login to access this application.')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows the redirecting page while the auth navigator is active', async () => {
    const screen = await renderWithAuth(createAuth({ activeNavigator: 'signinRedirect' }));

    await expect.element(screen.getByText('Redirecting').first()).toBeInTheDocument();
    await expect.element(screen.getByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows the session expired login page and logs the error when authentication failed', async () => {
    setIdentityProvider(true);

    const screen = await renderWithAuth(createAuth({ error: new Error('Token expired') }));

    await expect.element(screen.getByText('We could not log you in, or your session has expired.')).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: IDENTITY_PROVIDER.label })).toBeInTheDocument();
    await expect.element(screen.getByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows the login page with the after login element when not authenticated and no recent provider', async () => {
    setIdentityProvider(true);

    const screen = await renderWithAuth(
      createAuth(),
      (config) => {
        config.login = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          AfterLoginElement: () => (
            <div>
              {'After login content'}
            </div>
          ),
        };
      },
    );

    await expect.element(screen.getByText('You need to login to access this application.')).toBeInTheDocument();
    await expect.element(screen.getByText('After login content')).toBeInTheDocument();
    await expect.element(screen.getByText('Protected content')).not.toBeInTheDocument();
  });

  it('starts the sign-in redirect with the pre-login location when the identity provider button is clicked', async () => {
    setIdentityProvider(true);
    const auth = createAuth();

    const screen = await renderWithAuth(auth);

    await screen.getByRole('button', { name: IDENTITY_PROVIDER.label }).click();

    expect(auth.signinRedirect).toHaveBeenCalledTimes(1);
    expect(auth.signinRedirect).toHaveBeenCalledWith({
      state: {
        preLoginLocation: {
          hash: window.location.hash,
          pathname: window.location.pathname,
          search: window.location.search,
        },
      },
    });
  });

  it('automatically starts the sign-in redirect when the identity provider was selected very recently', async () => {
    setIdentityProvider(false);
    const auth = createAuth();

    const screen = await renderWithAuth(auth);

    expect(auth.signinRedirect).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByText('You need to login to access this application.')).not.toBeInTheDocument();
  });

  it('clears the stale state and resets the identity provider when choosing a different identity provider', async () => {
    setIdentityProvider(true);
    sessionStorage.setItem('oidc.stale', 'value');

    const screen = await renderWithAuth(createAuth());

    expect(container.resolve(AuthenticationService).data).toBe(IDENTITY_PROVIDER);
    await screen.getByRole('button', { name: 'Choose a different identity provider' }).click();

    expect(container.resolve(AuthenticationService).data).toBeUndefined();
    expect(sessionStorage.getItem('oidc.stale')).toBeNull();
  });

  it('renders the children and shares the auth context props when authenticated without a consent dialog', async () => {
    const auth = createAuth({ isAuthenticated: true });

    const screen = await renderWithAuth(auth, (config) => {
      config.consentDialog.getShouldShow = () => false;
    });

    await expect.element(screen.getByText('Protected content')).toBeInTheDocument();
    expect(container.resolve(AuthenticationService).authContextProps).toBe(auth);
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('shows the consent dialog when authenticated and closes it after consent is given', async () => {
    const screen = await renderWithAuth(
      createAuth({ isAuthenticated: true }),
      (config) => {
        config.consentDialog.getShouldShow = () => true;
        config.consentDialog.getButtonLabel = () => 'I agree';
        config.consentDialog.getTitle = () => 'Consent title';
        config.consentDialog.Content = () => (
          <div>
            {'Consent content'}
          </div>
        );
      },
    );

    await expect.element(screen.getByText('Consent content')).toBeInTheDocument();

    await screen.getByRole('button', { name: 'I agree' }).click();

    await expect.element(screen.getByText('Consent content')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
