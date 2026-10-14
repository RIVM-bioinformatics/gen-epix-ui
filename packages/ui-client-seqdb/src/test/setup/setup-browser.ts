import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { setupSeqDb } from '../../setup/setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';
import { createSeqDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  const config = {
    ...SeqDbStandardConfigUtil.createConfig(),
    theme: createSeqDbDemoTheme('light'),
  };
  setupSeqDb(DependencyContainerUtil.createUiClientCommonContainer(config));
};

setupTestEnvironment();
