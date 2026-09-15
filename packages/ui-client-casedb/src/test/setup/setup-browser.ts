import { ConfigService } from '@gen-epix/ui-client-common/classes/services/ConfigService';

import { setupCaseDb } from '../../setup/setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...CaseDbStandardConfigUtil.createConfig(),
    theme: createCaseDbDemoTheme('light'),
  };
  setupCaseDb();
};

setupTestEnvironment();
