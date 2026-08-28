import { ConfigService } from '../../classes/services/ConfigService';
import { setupUi } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...StandardConfigUtil.createConfig(),
    theme: createDemoTheme('light'),
  };
  setupUi();

  vi.setConfig({
    testTimeout: 10000,
  });
};
