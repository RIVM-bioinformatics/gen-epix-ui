import 'reflect-metadata';
import type { InternalAxiosRequestConfig } from 'axios';
import type { AuthContextProps } from 'react-oidc-context';
import type { IdentityProvider } from '@gen-epix/api-casedb';

import { AuthorizationManager } from '../AuthorizationManager';
import { WindowManager } from '../WindowManager';
import { Subject } from '../../Subject';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import type { AuthState } from '../../../models/auth';
import { oidcStore } from '../../../stores/oidcStore';

export const createdAtMetaDataKey = Symbol('createdAt');

export class AuthenticationManager extends SubscribableAbstract<IdentityProvider> {
  public static autoLoginSkew = 500;
  public static get instance(): AuthenticationManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.authentication = WindowManager.instance.window.managers.authentication || new AuthenticationManager();
    return WindowManager.instance.window.managers.authentication;
  }
  public authContextProps: AuthContextProps;

  public temporaryToken: string;

  private constructor() {
    super(new Subject(oidcStore.getState().configuration));
  }

  public static clearStaleState(): void {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('oidc')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  public getUserManagerSettingsCreatedAt(): number {
    return Reflect.getMetadata(createdAtMetaDataKey, this.data) as number;
  }

  public next(oidcConfiguration: IdentityProvider) {
    if (oidcConfiguration) {
      Reflect.defineMetadata(createdAtMetaDataKey, new Date().getTime(), oidcConfiguration);
      oidcStore.getState().setConfiguration(oidcConfiguration);
    } else {
      oidcStore.getState().setConfiguration(undefined);
    }
    super.next(oidcConfiguration);
  }

  public onRequest(request: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const accessToken = this.temporaryToken ?? this.authContextProps?.user?.access_token;
    if (accessToken) {
      request.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return request;
  }

  public onResponseRejected(error: unknown): void {
    if (!this.temporaryToken && AxiosUtil.isAxiosUnauthorizedError(error)) {
      const redirectCounter = (this.authContextProps?.user?.state as AuthState)?.redirectCounter ?? 0;

      // If the user is not logged in, or the user is already redirected, throw the error

      if (redirectCounter > 0 || !AuthorizationManager.instance.user) {
        throw error;
      }

      const perform = async () => {
        if (!this.authContextProps) {
          return;
        }
        // Clean the stale state (removes items from the session storage)
        AuthenticationManager.clearStaleState();
        // Redirect the user to the IDP sign in page
        await this.authContextProps.signinRedirect({
          state: {
            preLoginLocation: {
              hash: WindowManager.instance.window.location.hash,
              pathname: WindowManager.instance.window.location.pathname,
              search: WindowManager.instance.window.location.search,
            },
            redirectCounter: redirectCounter + 1,
          },
        });
      };
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      perform();
    }
  }
}
