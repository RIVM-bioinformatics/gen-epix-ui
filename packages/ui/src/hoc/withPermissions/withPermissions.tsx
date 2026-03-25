import { useMemo } from 'react';
import type { ComponentType } from 'react';

import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import type { ApiPermission } from '../../api';

export interface WithPermissionsOptions {
  readonly requiredPermissions: ApiPermission[];
  readonly fallback?: ComponentType | null;
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
