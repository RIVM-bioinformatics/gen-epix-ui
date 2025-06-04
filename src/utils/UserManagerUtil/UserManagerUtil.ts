import {
  WebStorageStateStore,
  type UserManager,
  type UserManagerSettings,
} from 'oidc-client-ts';

import type { IdentityProvider } from '../../api';
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
      metadataUrl: oidcConfiguration.discovery_url,
      client_id: oidcConfiguration.client_id,
      client_secret: oidcConfiguration.client_secret,
      redirect_uri,
      response_type: 'code',
      post_logout_redirect_uri,
      scope: oidcConfiguration.scope,
      refreshTokenAllowedScope: '',
      validateSubOnSilentRenew: true,
      automaticSilentRenew: true,
      userStore: new WebStorageStateStore({
        store: sessionStorage,
      }),
    };
  }
}
