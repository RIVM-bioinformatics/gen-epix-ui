import { vi } from 'vitest';
import { ConfigManager } from '@gen-epix/ui';

import { setupOmopDb } from '../../setup';
import { OmopDbStandardConfigUtil } from '../lib';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = OmopDbStandardConfigUtil.createConfig();
  setupOmopDb();
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
