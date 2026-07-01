import { ConfigManager } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = {
    ...CaseDbStandardConfigUtil.createConfig(),
    theme: createCaseDbDemoTheme('light'),
  };
  setupCaseDb();
};

setupTestEnvironment();
