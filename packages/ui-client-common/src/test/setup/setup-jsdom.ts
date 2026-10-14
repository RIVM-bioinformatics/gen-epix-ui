import { createUiClientCommonContainer } from '../../classes/containers/UiClientCommonContainer';
import { setupUi } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  const config = {
    ...StandardConfigUtil.createConfig(),
    theme: createDemoTheme('light'),
  };
  createUiClientCommonContainer(config);
  setupUi();

  vi.setConfig({
    testTimeout: 10000,
  });
};
