/* eslint-disable @typescript-eslint/naming-convention */
import { t } from 'i18next';
import type { CaseDbConfig } from '@gen-epix/ui-casedb/models/config';
import { createCaseDbDemoTheme } from '@gen-epix/ui-casedb/theme/demoTheme';
import { CaseDbStandardConfigUtil } from '@gen-epix/ui-casedb/utils/CaseDbStandardConfigUtil';

import { ApplicationHeader } from '../../components/ApplicationHeader';
import { ConsentDialogContent } from '../../components/ConsentDialogContent';
import { HomePageIntroduction } from '../../components/HomePageIntroduction';
import { LicenseInformation } from '../../components/LicenseInformation';

export class ConfigUtil {
  public static createConfig(): CaseDbConfig {
    const config: CaseDbConfig = {
      ...CaseDbStandardConfigUtil.createConfig(),
      ApplicationHeader,
      consentDialog: {
        Content: ConsentDialogContent,
        getButtonLabel: () => t`I consent`,
        getShouldShow: () => !import.meta.env.DEV,
        getTitle: () => t`Consent`,
      },
      HomePageIntroduction,
      LicenseInformation,
      theme: createCaseDbDemoTheme('light'),
    };

    return config;
  }
}
