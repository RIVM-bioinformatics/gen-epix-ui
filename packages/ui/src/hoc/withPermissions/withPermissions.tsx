import { useMemo } from 'react';
import type { ComponentType } from 'react';
import type { ApiPermission } from '@gen-epix/api-casedb';

import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';

export interface WithPermissionsOptions {
  readonly fallback?: ComponentType | null;
  readonly requiredPermissions: ApiPermission[];
}

export const withPermissions = <TProps extends object>(
  Component: ComponentType<TProps>,
  options: WithPermissionsOptions,
) => {
  const WrappedComponent = (props: TProps) => {
    const authorizationManager = useMemo(() => AuthorizationManager.instance, []);

    if (!authorizationManager.doesUserHavePermission(options.requiredPermissions)) {
      if (options.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent />;
      }
      return null;
    }

    return <Component {...props} />;
  };

  // Set display name for better debugging
  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
