import { container } from 'tsyringe';
import { I18nService } from '@gen-epix/ui-client-common/classes/services/I18nService';
import { StandardConfigUtil } from '@gen-epix/ui-client-common/utils/StandardConfigUtil';
import { WINDOW_SERVICE_TOKEN } from '@gen-epix/ui-client-common/constants/api.constants';
import { t } from 'i18next';

import type { SeqDbConfig } from '../../models/config.models';

export class SeqDbStandardConfigUtil {
  public static createConfig(): Omit<SeqDbConfig, 'theme'> {
    const onEnglishClick = () => {
      container.resolve(I18nService).emit('onUserLanguageChange', 'en');
    };

    const onDutchClick = () => {
      container.resolve(I18nService).emit('onUserLanguageChange', 'nl');
    };

    const config: Omit<SeqDbConfig, 'theme'> = {
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
        const { location: { href } } = container.resolve(WINDOW_SERVICE_TOKEN).window.document;
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
        const { location: { href } } = container.resolve(WINDOW_SERVICE_TOKEN).window.document;
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
    };
    return config;
  }

}
