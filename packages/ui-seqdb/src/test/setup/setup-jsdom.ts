import { vi } from 'vitest';
import { ConfigManager } from '@gen-epix/ui';
import { setupSeqDb } from '../../setup';
import { SeqDbDemoConfigUtil } from '../lib';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = SeqDbDemoConfigUtil.createConfig();
  setupSeqDb();

  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
