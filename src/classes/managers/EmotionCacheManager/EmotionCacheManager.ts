import type { EmotionCache } from '@emotion/cache';
import createCache from '@emotion/cache';

import { ConfigManager } from '../ConfigManager';
import { WindowManager } from '../WindowManager';


export class EmotionCacheManager {
  public emotionCache: EmotionCache;

  private constructor() {
    this.emotionCache = createCache({
      key: 'genepix',
      stylisPlugins: [],
      nonce: ConfigManager.instance.config.nonce,
      prepend: !!ConfigManager.instance.config.nonce,
      container: window.document.head,
    });
  }

  public static get instance(): EmotionCacheManager {
    WindowManager.instance.window.managers.emotionCache = WindowManager.instance.window.managers.emotionCache || new EmotionCacheManager();
    return WindowManager.instance.window.managers.emotionCache;
  }
}
