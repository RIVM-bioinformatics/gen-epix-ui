import { ConfigService } from '../../classes/services/ConfigService';
import { setup } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigService.getInstance().config = {
    ...StandardConfigUtil.createConfig(),
    theme: createDemoTheme('light'),
  };
  setup();

  vi.setConfig({
    testTimeout: 10000,
  });
};
