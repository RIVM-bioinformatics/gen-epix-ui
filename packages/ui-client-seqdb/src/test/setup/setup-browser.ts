import { createUiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';

import { setupSeqDb } from '../../setup/setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';
import { createSeqDbDemoTheme } from '../../theme/demoTheme';

export const setupTestEnvironment = () => {
  const config = {
    ...SeqDbStandardConfigUtil.createConfig(),
    theme: createSeqDbDemoTheme('light'),
  };
  setupSeqDb(createUiClientCommonContainer(config));
};

setupTestEnvironment();
