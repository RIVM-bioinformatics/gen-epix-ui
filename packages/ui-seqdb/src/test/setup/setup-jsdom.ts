import { vi } from 'vitest';
import { ConfigService } from '@gen-epix/ui';

import { setupSeqDb } from '../../setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';
import { createSeqDbDemoTheme } from '../../theme/demoTheme';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...SeqDbStandardConfigUtil.createConfig(),
    theme: createSeqDbDemoTheme('light'),
  };
  setupSeqDb();

  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
