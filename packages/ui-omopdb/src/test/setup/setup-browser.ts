import { ConfigManager } from '@gen-epix/ui';

import { setupOmopDb } from '../../setup';
import { OmopDbDemoConfigUtil } from '../lib';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = OmopDbDemoConfigUtil.createConfig();
  setupOmopDb();
};

setupTestEnvironment();
