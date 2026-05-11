import { ConfigManager } from '@gen-epix/ui';

import { setupSeqDb } from '../../setup';
import { SeqDbDemoConfigUtil } from '../lib';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = SeqDbDemoConfigUtil.createConfig();
  setupSeqDb();
};

setupTestEnvironment();
