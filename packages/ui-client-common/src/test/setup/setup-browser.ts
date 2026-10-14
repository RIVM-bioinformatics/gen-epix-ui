import { createUiClientCommonContainer } from '../../classes/containers/UiClientCommonContainer';
import { setupUi } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

export const setupTestEnvironment = () => {
  const config = {
    ...StandardConfigUtil.createConfig(),
    theme: createDemoTheme('light'),
  };
  createUiClientCommonContainer(config);
  setupUi();
};

setupTestEnvironment();
