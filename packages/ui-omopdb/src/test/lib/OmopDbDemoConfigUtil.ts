import { DemoConfigUtil } from '@gen-epix/ui';

import type { OmopDbConfig } from '../../models/config';
import { createOmopDbDemoTheme } from '../../theme/demoTheme';

export class OmopDbDemoConfigUtil {
  public static createConfig(): OmopDbConfig {

    const config: OmopDbConfig = {
      ...DemoConfigUtil.createConfig(),
      applicationName: 'Gen-EpiX',

      theme: createOmopDbDemoTheme('light'),
    };
    return config;
  }
}
