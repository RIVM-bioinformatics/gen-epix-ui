import 'reflect-metadata';
import type { InternalAxiosRequestConfig } from 'axios';
import type { AuthContextProps } from 'react-oidc-context';
import type { CommonDbIdentityProvider } from '@gen-epix/api-commondb';
import type { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { SubscribableAbstract } from '@gen-epix/ui-core/classes/abstracts/SubscribableAbstract';
import {
  inject,
  singleton,
} from 'tsyringe';

import { AuthorizationService } from '../AuthorizationService';
import type { AuthState } from '../../../models/auth.models';
import { oidcStore } from '../../../stores/oidcStore';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { WINDOW_SERVICE_TOKEN } from '../../../constants/api.constants';

export const createdAtMetaDataKey = Symbol('createdAt');

@singleton()
export class AuthenticationService extends SubscribableAbstract<CommonDbIdentityProvider> {
  public static autoLoginSkew = 500;

  public authContextProps: AuthContextProps;

  public temporaryToken: string;
  private readonly authorizationService: AuthorizationService;
  private readonly windowService: WindowService;

  public constructor(
    @inject(AuthorizationService) authorizationService: AuthorizationService,
    @inject(WINDOW_SERVICE_TOKEN) windowService: WindowService,
  ) {
    super(new Subject(oidcStore.getState().configuration));
    this.authorizationService = authorizationService;
    this.windowService = windowService;
  }

  public static clearStaleState(): void {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('oidc')) {
        sessionStorage.removeItem(key);
      }
    });
  }


  public getUserManagerSettingsCreatedAt(): number | undefined {
    return this.data ? Reflect.getMetadata(createdAtMetaDataKey, this.data) as number : undefined;
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

      if (redirectCounter > 0 || !this.authorizationService.user) {
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
              hash: this.windowService.window.location.hash,
              pathname: this.windowService.window.location.pathname,
              search: this.windowService.window.location.search,
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
