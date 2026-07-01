import { ConfigManager } from '@gen-epix/ui';

import { setupOmopDb } from '../../setup';
import { OmopDbStandardConfigUtil } from '../../utils/OmopDbStandardConfigUtil';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = OmopDbStandardConfigUtil.createConfig();
  setupOmopDb();
};

setupTestEnvironment();
