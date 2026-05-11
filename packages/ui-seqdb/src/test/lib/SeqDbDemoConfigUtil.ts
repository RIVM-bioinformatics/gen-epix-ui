import { DemoConfigUtil } from '@gen-epix/ui';

import type { SeqDbConfig } from '../../models/config';
import { createSeqDbDemoTheme } from '../../theme/demoTheme';

export class SeqDbDemoConfigUtil {
  public static createConfig(): SeqDbConfig {

    const config: SeqDbConfig = {
      ...DemoConfigUtil.createConfig(),
      applicationName: 'Gen-EpiX',

      theme: createSeqDbDemoTheme('light'),
    };
    return config;
  }
}
