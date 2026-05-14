import { ConfigManager } from '../../classes/managers/ConfigManager';
import { setup } from '../../setup/setup';
import { DemoConfigUtil } from '../../utils/DemoConfigUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = DemoConfigUtil.createConfig();
  setup();

  vi.setConfig({
    testTimeout: 10000,
  });
};
