import { vi } from 'vitest';
import { createUiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';

import { setupCaseDb } from '../../setup/setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  const config = {
    ...CaseDbStandardConfigUtil.createConfig(),
    theme: createCaseDbDemoTheme('light'),
  };
  setupCaseDb(createUiClientCommonContainer(config));
  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
