import {
  AxiosUtil,
  I18nManager,
  WindowManager,
} from '@gen-epix/ui';
import {
  createSeqDbDemoTheme,
  type SeqDbConfig,
} from '@gen-epix/ui-seqdb';

import { ApplicationHeader } from '../../components/ApplicationHeader';
import { ConsentDialogContent } from '../../components/ConsentDialogContent';
import { HomePageIntroduction } from '../../components/HomePageIntroduction';
import { LicenseInformation } from '../../components/LicenseInformation';


const LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE = 'GenEpix-preferred-language';

export class ConfigUtil {
  public static createConfig(): SeqDbConfig {
    const onEnglishClick = () => {
      I18nManager.getInstance().emit('onUserLanguageChange', 'en');
    };

    const onDutchClick = () => {
      I18nManager.getInstance().emit('onUserLanguageChange', 'nl');
    };

    const setNewLanguageCode = async (code: string) => {
      return Promise.resolve(WindowManager.getInstance().window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code));
    };

    const getCurrentLanguageCode = async () => {
      return Promise.resolve(WindowManager.getInstance().window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE) ?? window.navigator.language.split('-')[0] ?? 'en');
    };


    const config: SeqDbConfig = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ApplicationHeader,
      applicationName: 'Gen-EpiX - SEQ DB',
      consentDialog: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Content: ConsentDialogContent,
        getButtonLabel: (t) => t`I consent`,
        getShouldShow: () => !import.meta.env.DEV,
        getTitle: (t) => t`Consent`,
      },
      createFooter: (t) => ({
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
      defaultRequestTimeout: 30000,
      enablePageEvents: true,
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
      getEnvironmentMessage: (_t) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getSoftwareVersion: () => 'development',
      getTouchIconUrl: () => {
        return '/touch-icon.png';
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      HomePageIntroduction,
      i18n: {
        getCurrentLanguageCode,
        languages: [
          {
            bundles: [
              '/locale/en.json',
              '/locale/ui/en.json',
              '/locale/ui-seqdb/en.json',
            ],
            code: 'en',
          },
          {
            bundles: [
              '/locale/nl.json',
              '/locale/ui/nl.json',
              '/locale/ui-seqdb/nl.json',
            ],
            code: 'nl',
          },
        ],
        setNewLanguageCode,
      },
      layout: {
        MAIN_CONTENT_ID: 'main-content',
        SIDEBAR_MENU_WIDTH: 4,
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      LicenseInformation,
      log: {
        LOG_INTERVAL_MS: 30000,
      },
      notifications: {
        autoHideAfterMs: 5000,
      },
      outages: {
        NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES: 8,
      },
      queryClient: {
        retry: (import.meta.env.DEV)
          ? () => false
          : (failureCount: number, error: unknown) => {
            if (AxiosUtil.isAxiosInternalServerError(error) || AxiosUtil.isAxiosTimeoutError(error)) {
              return failureCount < 3;
            }
            return false;
          },
        retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 3000 : 3000, 30 * 1000),
      },
      spinner: {
        DEFAULT_CIRCULAR_PROGRESS_SIZE: 40,
        DEFAULT_TAKING_LONGER_TIMEOUT_MS: 8000,
      },
      table: {
        DEFAULT_OVERSCAN_MAIN: 10,
        DEFAULT_OVERSCAN_REVERSE: 10,
      },
      theme: createSeqDbDemoTheme('light'),
      userFeedback: {
        SHOW_USER_FEEDBACK_TOOLTIP_AFTER_MS: 2 * 60 * 1000, // 2 minutes
      },
      userInactivityConfirmation: {
        ALLOWED_IDLE_TIME_MS: 25 * 60 * 1000, // 25 minutes
        NOTIFICATION_TIME_MS: 5 * 60 * 1000, // 5 minutes
      },
    };
    return config;
  }
}
