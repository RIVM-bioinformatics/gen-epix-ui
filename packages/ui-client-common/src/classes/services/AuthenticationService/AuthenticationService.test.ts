import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { AuthContextProps } from 'react-oidc-context';
import { CommonDbAuthProtocol } from '@gen-epix/api-commondb';
import type {
  CommonDbIdentityProvider,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { AuthorizationService } from '../AuthorizationService';
import type { PageEventBusService } from '../PageEventBusService';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { oidcStore } from '../../../stores/oidcStore';

import {
  AuthenticationService,
  createdAtMetaDataKey,
} from './AuthenticationService';

const createIdentityProvider = (): CommonDbIdentityProvider => ({
  auth_protocol: CommonDbAuthProtocol.OIDC,
  issuer: 'https://identity.example',
  label: 'Example provider',
  name: 'example-provider',
});

const createAuthContextProps = (
  user?: { access_token?: string; state?: unknown },
  signinRedirect = vi.fn().mockResolvedValue(undefined),
): AuthContextProps => ({
  signinRedirect,
  user,
}) as unknown as AuthContextProps;

const createAuthorizationService = (user?: CommonDbUser): AuthorizationService => {
  const pageEventBusService = {
    emit: vi.fn(),
  } as unknown as PageEventBusService;
  const authorizationService = new AuthorizationService(pageEventBusService);

  if (user) {
    authorizationService.user = user;
  }
  return authorizationService;
};

const createService = (authorizationService = createAuthorizationService()): AuthenticationService => new AuthenticationService(
  authorizationService,
  WindowService.getInstance(),
);

const createRequest = (): InternalAxiosRequestConfig => ({
  headers: new AxiosHeaders(),
});

const initialConfiguration = oidcStore.getState().configuration;

describe('AuthenticationService', () => {
  beforeEach(() => {
    oidcStore.getState().setConfiguration(undefined);
  });

  afterEach(() => {
    oidcStore.getState().setConfiguration(initialConfiguration);
    sessionStorage.removeItem('oidc.user.test');
    sessionStorage.removeItem('unrelated.test');
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('exposes the metadata key and automatic-login skew', () => {
    expect(typeof createdAtMetaDataKey).toBe('symbol');
    expect(AuthenticationService.autoLoginSkew).toBe(500);
  });

  it('clears only session storage keys prefixed with oidc', () => {
    sessionStorage.setItem('oidc.user.test', 'old-state');
    sessionStorage.setItem('unrelated.test', 'keep');

    AuthenticationService.clearStaleState();

    expect(sessionStorage.getItem('oidc.user.test')).toBeNull();
    expect(sessionStorage.getItem('unrelated.test')).toBe('keep');
  });

  it('returns no creation time before a configuration is available', () => {
    const service = createService();

    expect(service.data).toBeUndefined();
    expect(service.getUserManagerSettingsCreatedAt()).toBeUndefined();
  });

  it('updates the configuration, metadata, and subscribers for configured and empty states', () => {
    const service = createService();
    const subscriber = vi.fn();
    const configuration = createIdentityProvider();
    service.subscribe(subscriber);

    service.next(configuration);

    expect(service.data).toBe(configuration);
    expect(oidcStore.getState().configuration).toBe(configuration);
    expect(service.getUserManagerSettingsCreatedAt()).toBe(Reflect.getMetadata(createdAtMetaDataKey, configuration));
    expect(service.getUserManagerSettingsCreatedAt()).toEqual(expect.any(Number));
    expect(subscriber).toHaveBeenNthCalledWith(1, configuration, undefined);

    service.next(undefined);

    expect(service.data).toBeUndefined();
    expect(oidcStore.getState().configuration).toBeUndefined();
    expect(service.getUserManagerSettingsCreatedAt()).toBeUndefined();
    expect(subscriber).toHaveBeenNthCalledWith(2, undefined, configuration);
  });

  it('returns the same request and sets an authorization header from available tokens', () => {
    const service = createService();
    service.authContextProps = createAuthContextProps({ access_token: 'context-token' });

    const contextRequest = createRequest();
    expect(service.onRequest(contextRequest)).toBe(contextRequest);
    const contextHeader = contextRequest.headers.get('Authorization');
    expect(contextHeader).toBeTruthy();

    service.temporaryToken = 'temporary-token';
    const temporaryRequest = createRequest();
    expect(service.onRequest(temporaryRequest)).toBe(temporaryRequest);
    const temporaryHeader = temporaryRequest.headers.get('Authorization');

    expect(temporaryHeader).toBeTruthy();
    expect(temporaryHeader).not.toBe(contextHeader);
  });

  it('leaves requests without an available token unchanged', () => {
    const service = createService();
    const request = createRequest();

    expect(service.onRequest(request)).toBe(request);
    expect(request.headers.has('Authorization')).toBe(false);
  });

  it('ignores non-unauthorized errors and unauthorized errors with a temporary token', () => {
    const service = createService();
    const unauthorizedSpy = vi.spyOn(AxiosUtil, 'isAxiosUnauthorizedError');
    const error = new Error('request failed');

    unauthorizedSpy.mockReturnValue(false);
    expect(() => service.onResponseRejected(error)).not.toThrow();

    unauthorizedSpy.mockReturnValue(true);
    service.temporaryToken = 'temporary-token';
    expect(() => service.onResponseRejected(error)).not.toThrow();
  });

  it('throws unauthorized errors when no user is available or a redirect was already attempted', () => {
    const unauthorizedSpy = vi.spyOn(AxiosUtil, 'isAxiosUnauthorizedError').mockReturnValue(true);
    const error = new Error('unauthorized');
    const noUserService = createService();

    expect(() => noUserService.onResponseRejected(error)).toThrowError(error);

    const user: CommonDbUser = {
      organization_id: 'organization-id',
      roles: [],
    };
    const redirectedService = createService(createAuthorizationService(user));
    redirectedService.authContextProps = createAuthContextProps({ state: { redirectCounter: 1 } });

    expect(() => redirectedService.onResponseRejected(error)).toThrowError(error);
    expect(unauthorizedSpy).toHaveBeenCalledTimes(2);
  });

  it('does not start a redirect if no authentication context is available', () => {
    vi.spyOn(AxiosUtil, 'isAxiosUnauthorizedError').mockReturnValue(true);
    const user: CommonDbUser = {
      organization_id: 'organization-id',
      roles: [],
    };
    const service = createService(createAuthorizationService(user));

    expect(() => service.onResponseRejected(new Error('unauthorized'))).not.toThrow();
  });

  it('clears stale state and redirects with the current location and incremented counter', () => {
    vi.spyOn(AxiosUtil, 'isAxiosUnauthorizedError').mockReturnValue(true);
    window.history.replaceState({}, '', '/cases?status=open#table');
    sessionStorage.setItem('oidc.user.test', 'old-state');
    sessionStorage.setItem('unrelated.test', 'keep');
    const signinRedirect = vi.fn().mockResolvedValue(undefined);
    const user: CommonDbUser = {
      organization_id: 'organization-id',
      roles: [],
    };
    const service = createService(createAuthorizationService(user));
    service.authContextProps = createAuthContextProps({ state: { redirectCounter: 0 } }, signinRedirect);

    service.onResponseRejected(new Error('unauthorized'));

    expect(sessionStorage.getItem('oidc.user.test')).toBeNull();
    expect(sessionStorage.getItem('unrelated.test')).toBe('keep');
    expect(signinRedirect).toHaveBeenCalledExactlyOnceWith({
      state: {
        preLoginLocation: {
          hash: '#table',
          pathname: '/cases',
          search: '?status=open',
        },
        redirectCounter: 1,
      },
    });
  });
});
