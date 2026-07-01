import { vi } from 'vitest';
import { ConfigManager } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = CaseDbStandardConfigUtil.createConfig();
  setupCaseDb();
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
