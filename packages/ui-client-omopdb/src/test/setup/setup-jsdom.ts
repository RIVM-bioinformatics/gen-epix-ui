import { vi } from 'vitest';
import { ConfigService } from '@gen-epix/ui-client-common/classes/services/ConfigService';

import { setupOmopDb } from '../../setup/setup';
import { OmopDbStandardConfigUtil } from '../../utils/OmopDbStandardConfigUtil';
import { createOmopDbDemoTheme } from '../../theme/demoTheme';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...OmopDbStandardConfigUtil.createConfig(),
    theme: createOmopDbDemoTheme('light'),
  };
  setupOmopDb();
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
