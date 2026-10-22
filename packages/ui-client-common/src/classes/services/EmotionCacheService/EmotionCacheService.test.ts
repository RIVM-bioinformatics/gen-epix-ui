import {
  describe,
  expect,
  it,
} from 'vitest';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import type { ConfigBase } from '../../../models/config.models';

import { EmotionCacheService } from './EmotionCacheService';

const createConfig = (nonce?: string): ConfigBase => ({ nonce } as ConfigBase);

describe('EmotionCacheService', () => {
  it('creates a cache in the document head with the configured key and nonce', () => {
    const service = new EmotionCacheService(createConfig('test-nonce'), WindowService.getInstance());

    expect(service.emotionCache.key).toBe('genepix');
    expect(service.emotionCache.sheet.container).toBe(document.head);
    expect(service.emotionCache.sheet.nonce).toBe('test-nonce');
    expect(service.emotionCache.sheet.prepend).toBe(true);
  });

  it('creates a cache without a nonce when none is configured', () => {
    const service = new EmotionCacheService(createConfig(), WindowService.getInstance());

    expect(service.emotionCache.key).toBe('genepix');
    expect(service.emotionCache.sheet.container).toBe(document.head);
    expect(service.emotionCache.sheet.nonce).toBeUndefined();
    expect(service.emotionCache.sheet.prepend).toBe(false);
  });
});
