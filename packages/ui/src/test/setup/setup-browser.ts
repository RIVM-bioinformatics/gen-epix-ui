import {
  ConfigManager,
  setup,
} from '@gen-epix/ui';

import { DemoConfigUtil } from '../lib/DemoConfigUtil';

export const setupTestEnvironment = () => {
  ConfigManager.getInstance().config = DemoConfigUtil.createConfig();
  setup();
};
