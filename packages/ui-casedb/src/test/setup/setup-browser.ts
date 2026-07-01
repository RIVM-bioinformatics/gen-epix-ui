import { ConfigManager } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbStandardConfigUtil } from '../lib';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = CaseDbStandardConfigUtil.createConfig();
  setupCaseDb();
};

setupTestEnvironment();
