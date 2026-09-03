import { useMemo } from 'react';
import type { ComponentType } from 'react';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';

import { AuthorizationService } from '../../classes/services/AuthorizationService';

export interface WithPermissionsOptions<TApiPermission = CommonDbApiPermission> {
  readonly fallback?: ComponentType | null;
  readonly requiredPermissions: TApiPermission[];
}

export const withPermissions = <TApiPermission = CommonDbApiPermission, TProps extends object = Record<string, never>>(
  Component: ComponentType<TProps>,
  options: WithPermissionsOptions<TApiPermission>,
) => {
  const WrappedComponent = (props: TProps) => {
    const authorizationService = useMemo(() => AuthorizationService.getInstance(), []);

    if (!authorizationService.doesUserHavePermission(options.requiredPermissions as CommonDbApiPermission[])) {
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
