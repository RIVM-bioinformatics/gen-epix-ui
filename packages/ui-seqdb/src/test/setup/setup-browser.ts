import { ConfigManager } from '@gen-epix/ui';

import { setupSeqDb } from '../../setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = SeqDbStandardConfigUtil.createConfig();
  setupSeqDb();
};

setupTestEnvironment();
