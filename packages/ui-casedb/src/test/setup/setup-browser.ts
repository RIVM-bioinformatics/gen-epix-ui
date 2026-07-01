import { ConfigManager } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = CaseDbStandardConfigUtil.createConfig();
  setupCaseDb();
};

setupTestEnvironment();
