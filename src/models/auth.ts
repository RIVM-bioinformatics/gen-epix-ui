import type { Path } from 'react-router-dom';

import type { IdentityProvider } from '../api';

export type AuthState = {
  preLoginLocation: Path;
  lastRedirectTimestamp?: number;
  redirectCounter?: number;
};

export type IdentityProviderWithAvailability = {
  provider: IdentityProvider;
  isAvailable: boolean;
};
