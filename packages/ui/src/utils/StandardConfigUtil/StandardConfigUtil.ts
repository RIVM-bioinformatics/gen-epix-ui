import type { ConfigBase } from '../../models/config';
import { AxiosUtil } from '../AxiosUtil';

const ApplicationHeader = (): ReturnType<ConfigBase['ApplicationHeader']> => null;
const ConsentDialogContent = (): ReturnType<ConfigBase['consentDialog']['Content']> => null;
const HomePageIntroduction = (): ReturnType<ConfigBase['HomePageIntroduction']> => null;
const LicenseInformation = (): ReturnType<ConfigBase['LicenseInformation']> => null;

export class StandardConfigUtil {
  public static createConfig(): Omit<ConfigBase, 'theme'> {
    const config: Omit<ConfigBase, 'theme'> = {
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
      getEnvironmentMessage: () => {
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
        CONDENSED_WIDTH_PX: 150,
        DEFAULT_OVERSCAN_MAIN: 10,
        DEFAULT_OVERSCAN_REVERSE: 10,
      },
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
