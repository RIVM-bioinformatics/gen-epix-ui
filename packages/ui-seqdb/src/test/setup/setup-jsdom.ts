import { vi } from 'vitest';
import { ConfigManager } from '@gen-epix/ui';

import { setupSeqDb } from '../../setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = SeqDbStandardConfigUtil.createConfig();
  setupSeqDb();

  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
