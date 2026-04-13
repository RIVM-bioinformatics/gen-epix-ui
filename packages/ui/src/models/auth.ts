import type { Path } from 'react-router-dom';
import type { IdentityProvider } from '@gen-epix/api-casedb';

export type AuthState = {
  lastRedirectTimestamp?: number;
  preLoginLocation: Path;
  redirectCounter?: number;
};

export type IdentityProviderWithAvailability = {
  isAvailable: boolean;
  provider: IdentityProvider;
};
