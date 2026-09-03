import type { UserManager } from 'oidc-client-ts';

declare global {
  interface Window {
    userManager: UserManager;
  }
}
