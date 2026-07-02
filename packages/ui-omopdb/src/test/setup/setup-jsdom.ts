import { vi } from 'vitest';
import { ConfigService } from '@gen-epix/ui';

import { setupOmopDb } from '../../setup';
import { OmopDbStandardConfigUtil } from '../../utils/OmopDbStandardConfigUtil';
import { createOmopDbDemoTheme } from '../..';

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
