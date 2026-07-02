import 'reflect-metadata';
import type { InternalAxiosRequestConfig } from 'axios';
import type { AuthContextProps } from 'react-oidc-context';
import type { CommonDbIdentityProvider } from '@gen-epix/api-commondb';

import { HmrUtil } from '../../../utils/HmrUtil';
import { AuthorizationService } from '../AuthorizationService';
import { WindowService } from '../WindowService';
import { Subject } from '../../Subject';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import type { AuthState } from '../../../models/auth';
import { oidcStore } from '../../../stores/oidcStore';

export const createdAtMetaDataKey = Symbol('createdAt');

export class AuthenticationService extends SubscribableAbstract<CommonDbIdentityProvider> {
  public static autoLoginSkew = 500;
  private static __instance: AuthenticationService;

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

  public static getInstance(): AuthenticationService {
    AuthenticationService.__instance = HmrUtil.getHmrSingleton('authenticationService', AuthenticationService.__instance, () => new AuthenticationService());
    return AuthenticationService.__instance;
  }

  public getUserManagerSettingsCreatedAt(): number {
    return Reflect.getMetadata(createdAtMetaDataKey, this.data) as number;
  }

  public next(oidcConfiguration: CommonDbIdentityProvider) {
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

      if (redirectCounter > 0 || !AuthorizationService.getInstance().user) {
        throw error;
      }

      const perform = async () => {
        if (!this.authContextProps) {
          return;
        }
        // Clean the stale state (removes items from the session storage)
        AuthenticationService.clearStaleState();
        // Redirect the user to the IDP sign in page
        await this.authContextProps.signinRedirect({
          state: {
            preLoginLocation: {
              hash: WindowService.getInstance().window.location.hash,
              pathname: WindowService.getInstance().window.location.pathname,
              search: WindowService.getInstance().window.location.search,
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
