import {
  type UserManager,
  type UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client-ts';
import type { IdentityProvider } from '@gen-epix/api-casedb';

import { WindowManager } from '../../classes/managers/WindowManager';

export class UserManagerUtil {
  public static readonly userManager: UserManager;

  public static getSettings(oidcConfiguration: IdentityProvider): UserManagerSettings {
    const url = new URL(WindowManager.instance.window.location.href);
    url.search = '';
    url.pathname = '/post-login';
    const redirect_uri = url.toString();

    url.pathname = '/post-logout';
    const post_logout_redirect_uri = url.toString();

    return {
      authority: oidcConfiguration.issuer,
      automaticSilentRenew: true,
      client_id: oidcConfiguration.client_id,
      client_secret: oidcConfiguration.client_secret,
      metadataUrl: oidcConfiguration.discovery_url,
      post_logout_redirect_uri,
      redirect_uri,
      refreshTokenAllowedScope: '',
      response_type: 'code',
      scope: oidcConfiguration.scope,
      userStore: new WebStorageStateStore({
        store: sessionStorage,
      }),
      validateSubOnSilentRenew: true,
    };
  }
}
