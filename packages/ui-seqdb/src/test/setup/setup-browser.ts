import { ConfigManager } from '@gen-epix/ui';

import { setupSeqDb } from '../../setup';
import { SeqDbStandardConfigUtil } from '../lib';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = SeqDbStandardConfigUtil.createConfig();
  setupSeqDb();
};

setupTestEnvironment();
