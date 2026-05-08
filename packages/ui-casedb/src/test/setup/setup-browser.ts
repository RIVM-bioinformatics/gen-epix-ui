import { ConfigManager } from '@gen-epix/ui';

import { setupCaseDb } from '../../setup';
import { CaseDbDemoConfigUtil } from '../lib';

export const setupTestEnvironment = () => {
  const configManager = ConfigManager.getInstance();

  try {
    configManager.config;
  }
  catch {
    configManager.config = CaseDbDemoConfigUtil.createConfig();
  }

  setupCaseDb();
};

setupTestEnvironment();
