import { ConfigManager } from '@gen-epix/ui';

import { setupOmopDb } from '../../setup';
import { OmopDbStandardConfigUtil } from '../lib';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = OmopDbStandardConfigUtil.createConfig();
  setupOmopDb();
};

setupTestEnvironment();
