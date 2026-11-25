import type { EmotionCache } from '@emotion/cache';
import createCache from '@emotion/cache';
import {
  inject,
  singleton,
} from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { CONFIG_TOKEN } from '../../../constants/config.constants';
import type { ConfigBase } from '../../../models/config.models';


@singleton()
export class EmotionCacheService {
  public readonly emotionCache: EmotionCache;

  public constructor(
    @inject(CONFIG_TOKEN) config: ConfigBase,
    @inject(WindowService) windowService: WindowService,
  ) {
    const document = windowService.document;
    if (!document) {
      throw new Error('Cannot create an Emotion cache without a document.');
    }

    this.emotionCache = createCache({
      container: document.head,
      key: 'genepix',
      nonce: config.nonce,
      prepend: !!config.nonce,
      stylisPlugins: [],
    });
  }
}
