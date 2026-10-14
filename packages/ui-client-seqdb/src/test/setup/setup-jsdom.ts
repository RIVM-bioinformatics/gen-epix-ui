import { vi } from 'vitest';
import { createUiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';

import { setupSeqDb } from '../../setup/setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';
import { createSeqDbDemoTheme } from '../../theme/demoTheme';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  const config = {
    ...SeqDbStandardConfigUtil.createConfig(),
    theme: createSeqDbDemoTheme('light'),
  };
  setupSeqDb(createUiClientCommonContainer(config));

  vi.setConfig({
    testTimeout: 10000,
  });
};

setupTestEnvironment();
