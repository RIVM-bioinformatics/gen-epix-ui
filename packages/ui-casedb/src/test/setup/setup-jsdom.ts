import { vi } from 'vitest';
import { ConfigService } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...CaseDbStandardConfigUtil.createConfig(),
    theme: createCaseDbDemoTheme('light'),
  };
  setupCaseDb();
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
