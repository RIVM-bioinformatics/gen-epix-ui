import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';
import { setupClientCommon } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  const config = {
    ...StandardConfigUtil.createConfig(),
    theme: createDemoTheme('light'),
  };
  DependencyContainerUtil.createContainer(config);
  setupClientCommon();

  vi.setConfig({
    testTimeout: 10000,
  });
};
