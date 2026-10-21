import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { CommonDbAuthProtocol } from '@gen-epix/api-commondb';
import type { CommonDbIdentityProvider } from '@gen-epix/api-commondb';

import {
  createOidcStoreInitialState,
  oidcStore,
} from './oidcStore';

const INITIAL_CONFIGURATION = oidcStore.getState().configuration;

const createIdentityProvider = (): CommonDbIdentityProvider => ({
  auth_protocol: CommonDbAuthProtocol.OIDC,
  issuer: 'https://identity.example',
  label: 'Example identity provider',
  name: 'example-provider',
});

describe('oidcStore', () => {
  afterEach(() => {
    oidcStore.getState().setConfiguration(INITIAL_CONFIGURATION);
  });

  it('creates independent initial states without a selected configuration', () => {
    const firstState = createOidcStoreInitialState();
    const secondState = createOidcStoreInitialState();

    expect(firstState).toEqual({ configuration: undefined });
    expect(firstState).not.toBe(secondState);
  });

  it('stores identity provider configuration and persists it to session storage', () => {
    const configuration = createIdentityProvider();

    oidcStore.getState().setConfiguration(configuration);

    expect(oidcStore.getState().configuration).toBe(configuration);
    expect(sessionStorage.getItem('GENEPIX-OIDC-Configuration')).toBeTruthy();
  });

  it('clears the selected identity provider configuration', () => {
    oidcStore.getState().setConfiguration(createIdentityProvider());

    oidcStore.getState().setConfiguration(undefined);

    expect(oidcStore.getState().configuration).toBeUndefined();
  });
});
