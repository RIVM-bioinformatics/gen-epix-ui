import type { EmotionCache } from '@emotion/cache';
import createCache from '@emotion/cache';
import { HmrUtil } from '@gen-epix/ui-core/utils/HmrUtil';

import { ConfigService } from '../ConfigService';


export class EmotionCacheService {
  private static __instance: EmotionCacheService;

  public emotionCache: EmotionCache;

  private constructor() {
    this.emotionCache = createCache({
      container: window.document.head,
      key: 'genepix',
      nonce: ConfigService.getInstance().config.nonce,
      prepend: !!ConfigService.getInstance().config.nonce,
      stylisPlugins: [],
    });
  }

  public static getInstance(): EmotionCacheService {
    EmotionCacheService.__instance = HmrUtil.getHmrSingleton('emotionCacheService', EmotionCacheService.__instance, () => new EmotionCacheService());
    return EmotionCacheService.__instance;
  }
}
