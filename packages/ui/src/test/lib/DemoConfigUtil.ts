import type { ConfigBase } from '../../models/config';
import { AxiosUtil } from '../../utils/AxiosUtil';
import { createDemoTheme } from '../../theme/demoTheme';

const ApplicationHeader = (): ReturnType<ConfigBase['ApplicationHeader']> => null;
const ConsentDialogContent = (): ReturnType<ConfigBase['consentDialog']['Content']> => null;
const HomePageIntroduction = (): ReturnType<ConfigBase['HomePageIntroduction']> => null;
const LicenseInformation = (): ReturnType<ConfigBase['LicenseInformation']> => null;

let languageCode: string = 'en';

export class DemoConfigUtil {
  public static createConfig(): ConfigBase {
    const setNewLanguageCode = async (_code: string) => {
      languageCode = _code;
      return Promise.resolve();
    };

    const getCurrentLanguageCode = async () => {
      return Promise.resolve(languageCode);
    };

    const config: ConfigBase = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ApplicationHeader,
      applicationName: 'Gen-EpiX',
      consentDialog: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Content: ConsentDialogContent,
        getButtonLabel: () => 'I consent',
        getShouldShow: () => !import.meta.env.DEV,
        getTitle: () => 'Consent',
      },

      createFooter: () => ({
        sections: [
          {
            header: 'Contact',
            items: [
              {
                href: 'mailto:ids-bioinformatics@rivm.nl',
                label: 'ids-bioinformatics@rivm.nl',
              },
            ],
          },
          {
            header: 'About',
            items: [
              {
                href: 'https://github.com/RIVM-bioinformatics/gen-epix',
                label: 'Copyright',
              },
            ],
          },
          {
            header: 'Languages',
            items: [
              {
                label: 'English',
                onClick: () => null,
              },
            ],
          },
        ],
      }),
      defaultRequestTimeout: 30000,
      enablePageEvents: true,
      getAPIBaseUrl: () => {
        return 'development';
      },
      getEnvironmentMessage: (_t) => {
        return 'development';
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
              '/locale/gen-epix-ui/en.json',
            ],
            code: 'en',
          },
          {
            bundles: [
              '/locale/nl.json',
              '/locale/gen-epix-ui/nl.json',
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
      theme: createDemoTheme('light'),
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
