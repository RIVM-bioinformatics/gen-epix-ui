import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { setupCaseDb } from '../../setup/setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  const config = {
    ...CaseDbStandardConfigUtil.createConfig(),
    theme: createCaseDbDemoTheme('light'),
  };
  setupCaseDb(DependencyContainerUtil.createUiClientCommonContainer(config));
};

setupTestEnvironment();
