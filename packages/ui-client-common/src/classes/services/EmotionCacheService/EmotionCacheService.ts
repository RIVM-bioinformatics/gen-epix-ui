import type { EmotionCache } from '@emotion/cache';
import createCache from '@emotion/cache';
import {
  inject,
  singleton,
} from 'tsyringe';

import { CONFIG_TOKEN } from '../../../constants/config';
import type { ConfigBase } from '../../../models/config';


@singleton()
export class EmotionCacheService {
  public readonly emotionCache: EmotionCache;

  public constructor(@inject(CONFIG_TOKEN) config: ConfigBase) {
    this.emotionCache = createCache({
      container: window.document.head,
      key: 'genepix',
      nonce: config.nonce,
      prepend: !!config.nonce,
      stylisPlugins: [],
    });
  }
}
