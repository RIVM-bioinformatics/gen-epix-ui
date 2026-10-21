import {
  describe,
  expect,
  it,
} from 'vitest';

import { FeatureFlagsService } from './FeatureFlagsService';

describe('FeatureFlagsService', () => {
  it('throws until feature flags have been loaded', () => {
    const service = new FeatureFlagsService();

    expect(() => service.featureFlags).toThrowError(new Error('Feature flags have not been loaded yet'));
  });

  it('returns the configured feature flags object', () => {
    const service = new FeatureFlagsService();
    const featureFlags = {
      update_own_organization: true,
      use_new_dashboard: false,
    };

    service.featureFlags = featureFlags;

    expect(service.featureFlags).toBe(featureFlags);
    expect(service.featureFlags).toEqual({
      update_own_organization: true,
      use_new_dashboard: false,
    });
  });
});
