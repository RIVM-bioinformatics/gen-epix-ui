import type { CommonDbFeatureFlagsResponseBody } from '@gen-epix/api-commondb';

import { HmrUtil } from '../../../utils/HmrUtil';

export class FeatureFlagsService {
  private static __instance: FeatureFlagsService;

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

  public static getInstance(): FeatureFlagsService {
    FeatureFlagsService.__instance = HmrUtil.getHmrSingleton('featureFlagsService', FeatureFlagsService.__instance, () => new FeatureFlagsService());
    return FeatureFlagsService.__instance;
  }
}
