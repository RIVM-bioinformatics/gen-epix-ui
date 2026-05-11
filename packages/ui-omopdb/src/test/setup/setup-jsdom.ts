import { vi } from 'vitest';
import { ConfigManager } from '@gen-epix/ui';

import { setupOmopDb } from '../../setup';
import { OmopDbDemoConfigUtil } from '../lib';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = OmopDbDemoConfigUtil.createConfig();
  setupOmopDb();
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
