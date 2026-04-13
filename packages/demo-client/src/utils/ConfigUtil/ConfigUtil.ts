import type { Config } from '@gen-epix/ui';
import { ConfigUtil as DemoConfigUtil } from '@gen-epix/demo-config';

import { ApplicationHeader } from '../../components/ApplicationHeader';
import { ConsentDialogContent } from '../../components/ConsentDialogContent';
import { HomePageIntroduction } from '../../components/HomePageIntroduction';
import { LicenseInformation } from '../../components/LicenseInformation';


export class ConfigUtil {
  public static createConfig(): Config {
    const baseConfig = DemoConfigUtil.createConfig();
    return {
      ...baseConfig,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ApplicationHeader,
      consentDialog: {
        ...baseConfig.consentDialog,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Content: ConsentDialogContent,
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      HomePageIntroduction,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      LicenseInformation,
    };

  }
}
