import { ConfigManager } from '../../classes/managers/ConfigManager';
import { setup } from '../../setup/setup';
import { DemoConfigUtil } from '../lib/DemoConfigUtil';

export const setupTestEnvironment = () => {
  const configManager = ConfigManager.getInstance();
  let hasConfig = true;

  try {
    void configManager.config;
  } catch {
    hasConfig = false;
  }

  if (!hasConfig) {
    configManager.config = DemoConfigUtil.createConfig();
  }

  setup();
};

setupTestEnvironment();
