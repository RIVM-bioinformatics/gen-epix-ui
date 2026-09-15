import { ConfigService } from '@gen-epix/ui-client-common/classes/services/ConfigService';

import { setupSeqDb } from '../../setup/setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';
import { createSeqDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...SeqDbStandardConfigUtil.createConfig(),
    theme: createSeqDbDemoTheme('light'),
  };
  setupSeqDb();
};

setupTestEnvironment();
