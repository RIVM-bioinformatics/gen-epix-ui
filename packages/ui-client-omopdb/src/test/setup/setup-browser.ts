import { ConfigService } from '@gen-epix/ui-client-common/classes/services/ConfigService';

import { setupOmopDb } from '../../setup/setup';
import { OmopDbStandardConfigUtil } from '../../utils/OmopDbStandardConfigUtil';
import { createOmopDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...OmopDbStandardConfigUtil.createConfig(),
    theme: createOmopDbDemoTheme('light'),
  };
  setupOmopDb();
};

setupTestEnvironment();
