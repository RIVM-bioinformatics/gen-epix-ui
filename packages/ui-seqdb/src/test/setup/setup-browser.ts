import { ConfigService } from '@gen-epix/ui';

import { setupSeqDb } from '../../setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';
import { createSeqDbDemoTheme } from '../..';

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...SeqDbStandardConfigUtil.createConfig(),
    theme: createSeqDbDemoTheme('light'),
  };
  setupSeqDb();
};

setupTestEnvironment();
