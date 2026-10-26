import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { setupOmopDb } from '../../setup/setup';
import { OmopDbStandardConfigUtil } from '../../utils/OmopDbStandardConfigUtil';
import { createOmopDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  const config = {
    ...OmopDbStandardConfigUtil.createConfig(),
    theme: createOmopDbDemoTheme('light'),
  };
  DependencyContainerUtil.registerConfig(config);
  DependencyContainerUtil.initializeContainer();
  setupOmopDb();
};

setupTestEnvironment();
