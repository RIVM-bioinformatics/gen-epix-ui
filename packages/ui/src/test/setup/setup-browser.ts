import { ConfigManager } from '../../classes/managers/ConfigManager';
import { setup } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

export const setupTestEnvironment = () => {
  const configManager = ConfigManager.getInstance();
  let hasConfig = true;

  try {
    void configManager.config;
  } catch {
    hasConfig = false;
  }

  if (!hasConfig) {
    configManager.config = {
      ...StandardConfigUtil.createConfig(),
      theme: createDemoTheme('light'),
    };
  }

  setup();
};

setupTestEnvironment();
