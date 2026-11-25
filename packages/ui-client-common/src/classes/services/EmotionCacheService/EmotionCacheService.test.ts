import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import type { ConfigBase } from '../../../models/config.models';

import { EmotionCacheService } from './EmotionCacheService';

const createConfig = (nonce?: string): ConfigBase => ({ nonce } as ConfigBase);

describe('EmotionCacheService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('reports when the document is unavailable', () => {
    const windowService = WindowService.getInstance();
    vi.spyOn(windowService, 'document', 'get').mockReturnValue(null);

    expect(() => new EmotionCacheService(createConfig(), windowService)).toThrow('Cannot create an Emotion cache without a document.');
  });
});
