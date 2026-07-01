import {
  I18nManager,
  StandardConfigUtil,
  WindowManager,
} from '@gen-epix/ui';
import { t } from 'i18next';

import type { OmopDbConfig } from '../../models/config';
import { createOmopDbDemoTheme } from '../../theme/demoTheme';

export class OmopDbStandardConfigUtil {
  public static createConfig(): OmopDbConfig {
    const onEnglishClick = () => {
      I18nManager.getInstance().emit('onUserLanguageChange', 'en');
    };

    const onDutchClick = () => {
      I18nManager.getInstance().emit('onUserLanguageChange', 'nl');
    };

    const config: OmopDbConfig = {
      ...StandardConfigUtil.createConfig(),
      createFooter: () => ({
        sections: [
          {
            header: t`Contact`,
            items: [
              {
                href: 'mailto:ids-bioinformatics@rivm.nl',
                label: 'ids-bioinformatics@rivm.nl',
              },
              {
                href: 'https://github.com/RIVM-bioinformatics/gen-epix',
                label: t`Information for the press`,
              },
            ],
          },
          {
            header: t`About`,
            items: [
              {
                href: 'https://github.com/RIVM-bioinformatics/gen-epix',
                label: t`Copyright`,
              },
              {
                href: 'https://github.com/RIVM-bioinformatics/gen-epix',
                label: t`Accessibility`,
              },
            ],
          },
          {
            header: t`Languages`,
            items: [
              {
                label: t`English`,
                onClick: onEnglishClick,
              },
              {
                label: t`Dutch`,
                onClick: onDutchClick,
              },
            ],
          },
        ],
      }),
      enablePageEvents: false,

      getAPIBaseUrl: () => {
        const { location: { href } } = WindowManager.getInstance().window.document;
        const { hostname } = new URL(href);
        switch (hostname) {
          case '127.0.0.1':
            return `https://127.0.0.1:5010`;
          case 'localhost':
            return `https://localhost:5010`;
          default:
            return '';
        }
      },
      getEnvironmentMessage: () => {
        const { location: { href } } = WindowManager.getInstance().window.document;
        const { hostname } = new URL(href);
        let environment: string;
        switch (hostname) {
          case '127.0.0.1':
          case 'localhost':
          default:
            environment = 'localhost';
            break;
        }
        return environment;
      },
      theme: createOmopDbDemoTheme('light'),
    };
    return config;
  }

}
