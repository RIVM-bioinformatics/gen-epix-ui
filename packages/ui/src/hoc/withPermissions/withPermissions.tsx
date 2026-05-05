import { useMemo } from 'react';
import type { ComponentType } from 'react';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';

import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';

export interface WithPermissionsOptions<TApiPermission = CommonDbApiPermission> {
  readonly fallback?: ComponentType | null;
  readonly requiredPermissions: TApiPermission[];
}

export const withPermissions = <TApiPermission = CommonDbApiPermission, TProps extends object = null>(
  Component: ComponentType<TProps>,
  options: WithPermissionsOptions<TApiPermission>,
) => {
  const WrappedComponent = (props: TProps) => {
    const authorizationManager = useMemo(() => AuthorizationManager.instance, []);

    if (!authorizationManager.doesUserHavePermission(options.requiredPermissions as CommonDbApiPermission[])) {
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
