import { vi } from 'vitest';
import { ConfigManager } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbDemoConfigUtil } from '../lib';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = CaseDbDemoConfigUtil.createConfig();
  setupCaseDb();
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
