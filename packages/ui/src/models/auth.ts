import type { Path } from 'react-router-dom';
import type { CommonDbIdentityProvider } from '@gen-epix/api-commondb';

export type AuthState = {
  lastRedirectTimestamp?: number;
  preLoginLocation: Path;
  redirectCounter?: number;
};

export type IdentityProviderWithAvailability = {
  isAvailable: boolean;
  provider: CommonDbIdentityProvider;
};
