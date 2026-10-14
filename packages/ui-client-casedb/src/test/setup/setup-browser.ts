import { createUiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';

import { setupCaseDb } from '../../setup/setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  const config = {
    ...CaseDbStandardConfigUtil.createConfig(),
    theme: createCaseDbDemoTheme('light'),
  };
  setupCaseDb(createUiClientCommonContainer(config));
};

setupTestEnvironment();
