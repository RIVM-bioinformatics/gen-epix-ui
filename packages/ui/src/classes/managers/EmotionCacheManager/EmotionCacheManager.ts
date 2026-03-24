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
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.emotionCache = WindowManager.instance.window.managers.emotionCache || new EmotionCacheManager();
    return WindowManager.instance.window.managers.emotionCache;
  }
}
