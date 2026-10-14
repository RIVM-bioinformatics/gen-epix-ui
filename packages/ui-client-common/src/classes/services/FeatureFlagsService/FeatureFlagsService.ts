import type { CommonDbFeatureFlagsResponseBody } from '@gen-epix/api-commondb';
import {
  container as rootContainer,
  singleton,
} from 'tsyringe';

@singleton()
export class FeatureFlagsService {
  public get featureFlags(): CommonDbFeatureFlagsResponseBody['feature_flags'] {
    if (this.__featureFlags === null) {
      throw new Error('Feature flags have not been loaded yet');
    }
    return this.__featureFlags;
  }


  public set featureFlags(featureFlags: CommonDbFeatureFlagsResponseBody['feature_flags']) {
    this.__featureFlags = featureFlags;
  }


  private __featureFlags: CommonDbFeatureFlagsResponseBody['feature_flags'] = null;

  public static getInstance(): FeatureFlagsService {
    return rootContainer.resolve(FeatureFlagsService);
  }
}
