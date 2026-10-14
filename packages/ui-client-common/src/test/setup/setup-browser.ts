import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';
import { setupUi } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

export const setupTestEnvironment = () => {
  const config = {
    ...StandardConfigUtil.createConfig(),
    theme: createDemoTheme('light'),
  };
  DependencyContainerUtil.createUiClientCommonContainer(config);
  setupUi();
};

setupTestEnvironment();
