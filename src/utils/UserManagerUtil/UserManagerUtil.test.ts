import {
  describe,
  it,
  expect,
  vi,
} from 'vitest';

import type { IdentityProvider } from '../../api';
import { WindowManager } from '../../classes/managers/WindowManager';

import { UserManagerUtil } from './UserManagerUtil';

describe('UserManagerUtil', () => {
  describe('getSettings', () => {
    it('should generate proper UserManagerSettings based on the identity provider and window location', () => {
      const mockWindow = {
        location: { href: 'https://example.com/somepath?someQuery=123' },
      } as unknown as Window;
      vi.spyOn(WindowManager.instance, 'window', 'get').mockReturnValue(mockWindow as unknown as Window & typeof globalThis);

      const oidcConfiguration: Partial<IdentityProvider> = {
        issuer: 'https://test-issuer.com',
        discovery_url: 'https://test-issuer.com/.well-known/openid-configuration',
        client_id: 'client-id-123',
        client_secret: 'client-secret-abc',
        scope: 'openid profile',
      };

      const settings = UserManagerUtil.getSettings(oidcConfiguration as IdentityProvider);
      expect(settings.authority).toBe(oidcConfiguration.issuer);
      expect(settings.metadataUrl).toBe(oidcConfiguration.discovery_url);
      expect(settings.client_id).toBe(oidcConfiguration.client_id);
      expect(settings.client_secret).toBe(oidcConfiguration.client_secret);
      expect(settings.scope).toBe(oidcConfiguration.scope);
      expect(settings.redirect_uri).toBe('https://example.com/post-login');
      expect(settings.post_logout_redirect_uri).toBe('https://example.com/post-logout');

      vi.restoreAllMocks();
    });
  });
});
