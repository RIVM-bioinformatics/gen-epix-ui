import { vi } from 'vitest';
import { createUiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';

import { setupOmopDb } from '../../setup/setup';
import { OmopDbStandardConfigUtil } from '../../utils/OmopDbStandardConfigUtil';
import { createOmopDbDemoTheme } from '../../theme/demoTheme';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  const config = {
    ...OmopDbStandardConfigUtil.createConfig(),
    theme: createOmopDbDemoTheme('light'),
  };
  setupOmopDb(createUiClientCommonContainer(config));
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
