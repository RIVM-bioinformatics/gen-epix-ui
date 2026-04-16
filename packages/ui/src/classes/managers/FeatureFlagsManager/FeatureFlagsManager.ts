import type { CaseDbFeatureFlagsResponseBody } from '@gen-epix/api-casedb';

import { WindowManager } from '../WindowManager';

export class FeatureFlagsManager {
  public static get instance(): FeatureFlagsManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.featureFlags = WindowManager.instance.window.managers.featureFlags || new FeatureFlagsManager();
    return WindowManager.instance.window.managers.featureFlags;
  }


  public get featureFlags(): CaseDbFeatureFlagsResponseBody['feature_flags'] {
    if (this.__featureFlags === null) {
      throw new Error('Feature flags have not been loaded yet');
    }
    return this.__featureFlags;
  }


  public set featureFlags(featureFlags: CaseDbFeatureFlagsResponseBody['feature_flags']) {
    this.__featureFlags = featureFlags;
  }

  private __featureFlags: CaseDbFeatureFlagsResponseBody['feature_flags'] = null;

  private constructor() {
    //
  }
}
