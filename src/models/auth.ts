import type { Path } from 'react-router-dom';

export type AuthState = {
  preLoginLocation: Path;
  lastRedirectTimestamp?: number;
  redirectCounter?: number;
};
