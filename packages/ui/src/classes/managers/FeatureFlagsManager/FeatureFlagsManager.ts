import type { CommonDbFeatureFlagsResponseBody } from '@gen-epix/api-commondb';

import { HmrUtil } from '../../../utils/HmrUtil';

export class FeatureFlagsManager {
  private static __instance: FeatureFlagsManager;

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

  private constructor() {
    //
  }

  public static getInstance(): FeatureFlagsManager {
    FeatureFlagsManager.__instance = HmrUtil.getHmrSingleton('featureFlagsManager', FeatureFlagsManager.__instance, () => new FeatureFlagsManager());
    return FeatureFlagsManager.__instance;
  }
}
