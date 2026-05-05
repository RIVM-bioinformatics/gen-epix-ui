import type { EmotionCache } from '@emotion/cache';
import createCache from '@emotion/cache';

import { ConfigManager } from '../ConfigManager';
import { HmrUtil } from '../../../utils/HmrUtil';


export class EmotionCacheManager {
  private static __instance: EmotionCacheManager;

  public emotionCache: EmotionCache;

  private constructor() {
    this.emotionCache = createCache({
      container: window.document.head,
      key: 'genepix',
      nonce: ConfigManager.getInstance().config.nonce,
      prepend: !!ConfigManager.getInstance().config.nonce,
      stylisPlugins: [],
    });
  }

  public static getInstance(): EmotionCacheManager {
    EmotionCacheManager.__instance = HmrUtil.getHmrSingleton('emotionCacheManager', EmotionCacheManager.__instance, () => new EmotionCacheManager());
    return EmotionCacheManager.__instance;
  }
}
