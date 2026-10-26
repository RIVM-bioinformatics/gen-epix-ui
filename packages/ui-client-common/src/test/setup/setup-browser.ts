import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';
import { setupClientCommon } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

export const setupTestEnvironment = () => {
  DependencyContainerUtil.registerConfig({
    ...StandardConfigUtil.createConfig(),
    theme: createDemoTheme('light'),
  });
  setupClientCommon();
};

setupTestEnvironment();
