import { ConfigService } from '../../classes/services/ConfigService';
import { setup } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';

export const setupTestEnvironment = () => {
  const configService = ConfigService.getInstance();
  let hasConfig = true;

  try {
    void configService.config;
  } catch {
    hasConfig = false;
  }

  if (!hasConfig) {
    configService.config = {
      ...StandardConfigUtil.createConfig(),
      theme: createDemoTheme('light'),
    };
  }

  setup();
};

setupTestEnvironment();
