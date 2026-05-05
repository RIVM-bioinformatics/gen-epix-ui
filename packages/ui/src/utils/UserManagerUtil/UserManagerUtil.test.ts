import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { CommonDbIdentityProvider } from '@gen-epix/api-commondb';

import { WindowManager } from '../../classes/managers/WindowManager';

import { UserManagerUtil } from './UserManagerUtil';

describe('UserManagerUtil', () => {
  describe('getSettings', () => {
    it('should generate proper UserManagerSettings based on the identity provider and window location', () => {
      const mockWindow = {
        location: { href: 'https://example.com/somepath?someQuery=123' },
      } as unknown as Window;
      vi.spyOn(WindowManager.instance, 'window', 'get').mockReturnValue(mockWindow as unknown as typeof globalThis & Window);

      const oidcConfiguration: Partial<CommonDbIdentityProvider> = {
        client_id: 'client-id-123',
        client_secret: 'client-secret-abc',
        discovery_url: 'https://test-issuer.com/.well-known/openid-configuration',
        issuer: 'https://test-issuer.com',
        scope: 'openid profile',
      };

      const settings = UserManagerUtil.getSettings(oidcConfiguration as CommonDbIdentityProvider);
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
