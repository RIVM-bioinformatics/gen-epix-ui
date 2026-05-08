import { ConfigManager } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbDemoConfigUtil } from '../lib';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = CaseDbDemoConfigUtil.createConfig();
  setupCaseDb();
};

setupTestEnvironment();
