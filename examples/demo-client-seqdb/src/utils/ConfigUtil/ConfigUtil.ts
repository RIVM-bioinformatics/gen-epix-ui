import type { SeqDbConfig } from '@gen-epix/ui-seqdb';
import { SeqDbStandardConfigUtil } from '@gen-epix/ui-seqdb';
import { t } from 'i18next';

import { ApplicationHeader } from '../../components/ApplicationHeader';
import { ConsentDialogContent } from '../../components/ConsentDialogContent';
import { HomePageIntroduction } from '../../components/HomePageIntroduction';
import { LicenseInformation } from '../../components/LicenseInformation';

export class ConfigUtil {
  public static createConfig(): SeqDbConfig {
    const config: SeqDbConfig = {
      ...SeqDbStandardConfigUtil.createConfig(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ApplicationHeader,
      applicationName: 'Gen-EpiX - SeqDB',
      consentDialog: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Content: ConsentDialogContent,
        getButtonLabel: () => t`I consent`,
        getShouldShow: () => !import.meta.env.DEV,
        getTitle: () => t`Consent`,
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      HomePageIntroduction,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      LicenseInformation,
    };

    return config;
  }
}
