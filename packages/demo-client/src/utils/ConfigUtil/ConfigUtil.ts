import {
  format,
  subDays,
} from 'date-fns';

import {
  WindowManager,
  EPI_ZONE,
  ColType,
  I18nManager,
} from '@gen-epix/ui';
import type {
  Config,
  EpiDashboardLayoutConfig,
} from '@gen-epix/ui';
import { createTheme } from '@gen-epix/demo-theme';

import { ApplicationHeader } from '../../components/ApplicationHeader';
import { ConsentDialogContent } from '../../components/ConsentDialogContent';
import { HomePageIntroduction } from '../../components/HomePageIntroduction';
import { LicenseInformation } from '../../components/LicenseInformation';


const LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE = 'GenEpix-preferred-language';

export class ConfigUtil {
  public static createConfig(): Config {
    const onEnglishClick = () => {
      I18nManager.instance.emit('onUserLanguageChange', 'en');
    };

    const onDutchClick = () => {
      I18nManager.instance.emit('onUserLanguageChange', 'nl');
    };

    const setNewLanguageCode = async (code: string) => {
      return Promise.resolve(WindowManager.instance.window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code));
    };

    const getCurrentLanguageCode = async () => {
      return Promise.resolve(WindowManager.instance.window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE) ?? window.navigator.language.split('-')[0] ?? 'en');
    };


    const PANEL_ZONES = [EPI_ZONE.EPI_CURVE, EPI_ZONE.LINE_LIST, EPI_ZONE.MAP, EPI_ZONE.TREE];
    const config: Config = {
      i18n: {
        setNewLanguageCode,
        getCurrentLanguageCode,
        languages: [
          {
            code: 'en',
            bundles: [
              '/locale/en.json',
              '/locale/gen-epix-ui/en.json',
            ],
          },
          {
            code: 'nl',
            bundles: [
              '/locale/nl.json',
              '/locale/gen-epix-ui/nl.json',
            ],
          },
        ],
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
      enablePageEvents: true,
      applicationName: 'Gen-EpiX',
      theme: createTheme('light'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ApplicationHeader,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      HomePageIntroduction,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      LicenseInformation,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getSoftwareVersion: () => import.meta.env.VITE_RELEASED_VERSION as string ?? `${__PACKAGE_JSON_VERSION__}-snapshot-${__COMMIT_HASH__}`,
      defaultRequestTimeout: 30000,
      getAPIBaseUrl: () => {
        const { location: { href } } = WindowManager.instance.window.document;
        const { hostname } = new URL(href);
        switch (hostname) {
          case 'localhost':
            return 'https://localhost:5010';
          case '127.0.0.1':
            return 'https://127.0.0.1:5010';
          default:
            return '';
        }
      },
      getTouchIconUrl: () => {
        return '/touch-icon.png';
      },
      getEnvironmentMessage: (_t) => {
        const { location: { href } } = WindowManager.instance.window.document;
        const { hostname } = new URL(href);
        let environment = '';
        switch (hostname) {
          case 'localhost':
          case '127.0.0.1':
          default:
            environment = 'localhost';
            break;
        }
        return environment;
      },
      trends: {
        homePage: {
          getSinceLabel: (t) => t`since last year`,
          getSinceDate: () => format(subDays(new Date().toISOString(), 365), 'yyyy-MM-dd'),
        },
      },
      consentDialog: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Content: ConsentDialogContent,
        getShouldShow: () => !import.meta.env.DEV,
        getTitle: (t) => t`Consent`,
        getButtonLabel: (t) => t`I consent`,
      },
      notifications: {
        autoHideAfterMs: 5000,
      },
      epi: {
        SEQDB_MAX_STORED_DISTANCE_FALLBACK: 20,
        ALLOWED_COL_TYPES_FOR_STRATIFICATION: [
          ColType.NOMINAL,
          ColType.TEXT,
          ColType.ORDINAL,
          ColType.GEO_REGION,
          ColType.ORGANIZATION,
        ],
        DATA_MISSING_CHARACTER: '·',
        INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY: 5,
        STRATIFICATION_COLORS: [
          '#1B7BFF',
          '#FF0000',
          '#1BFF2A',
          '#FF8C1B',
          '#E317FD',
          '#FDFF17',
          '#8DBDFF',
          '#FF8080',
          '#8DFF95',
          '#FFC68D',
          '#F18BFE',
          '#FEFF8B',
          '#0E3E80',
          '#800000',
          '#0E8015',
          '#80460E',
          '#720C7F',
          '#7F800C',
          '#C6DFFF',
          '#FFBFBF',
          '#C6FFCA',
          '#FFE2C6',
          '#F8C5FF',
          '#FFFFC5',
          '#071F40',
          '#400000',
          '#07400B',
          '#402307',
          '#39063F',
          '#3F4006',
        ],
        STRATIFICATION_COLOR_ITEM_MISSING: '#000',
        DOWNLOAD_SECTION_ORDER: [EPI_ZONE.LINE_LIST, EPI_ZONE.TREE, EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP],
      },
      epiMap: {
        MIN_PIE_CHART_RADIUS: 4,
      },
      epiTree: {
        MIN_SCALE_WIDTH_PX: 48,
        MAX_SCALE_WIDTH_PX: 144,
        SCALE_INCREMENTS: [1, 2, 5, 10, 20, 50],
        LEAF_DOT_RADIUS: 5,
        ANCESTOR_DOT_RADIUS: 3,
        MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL: 1,
        REGULAR_FILL_COLOR_SUPPORT_LINE: '#E0E6F1',
        HEADER_HEIGHT: 32,
        TREE_PADDING: 20,
        LINKED_SCROLL_DEBOUNCE_DELAY_MS: 500,
        MAX_ZOOM_LEVEL: 20,
        MIN_ZOOM_LEVEL: 0.1,
        MIN_ZOOM_SPEED: 0.1,
        INITIAL_UNLINKED_ZOOM_LEVEL: 1.05,
        PANNING_THRESHOLD: 25,
        MAX_ZOOM_SPEED: 0.25,
        TAKING_LONGER_TIMEOUT_MS: 10000,
      },
      epiLineList: {
        TABLE_ROW_HEIGHT: 24,
        MAX_COLUMN_WIDTH: 400,
        REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT: 36,
        CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS: 1000,
      },
      epiDashboard: {
        MIN_PANEL_WIDTH: 30,
        MIN_PANEL_HEIGHT: 30,
        LAYOUTS: [
          // 1 ZONE
          ...PANEL_ZONES.map<EpiDashboardLayoutConfig>(zone => ({
            zones: [zone],
            layouts: [
              [
                'vertical',
                [100, [100, zone]],
              ],
            ],
          })),

          // 2 ZONES
          {
            zones: [EPI_ZONE.LINE_LIST, EPI_ZONE.TREE],
            layouts: [
              [
                'horizontal',
                [50, [100, EPI_ZONE.TREE]],
                [50, [100, EPI_ZONE.LINE_LIST]],
              ],
            ],
          },
          ...[EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP].map<EpiDashboardLayoutConfig>(zone => ({
            zones: [EPI_ZONE.LINE_LIST, zone],
            layouts: [
              [
                'vertical',
                [70, [100, EPI_ZONE.LINE_LIST]],
                [30, [100, zone]],
              ],
              [
                'vertical',
                [30, [100, zone]],
                [70, [100, EPI_ZONE.LINE_LIST]],
              ],
              [
                'horizontal',
                [70, [100, EPI_ZONE.LINE_LIST]],
                [30, [100, zone]],
              ],
              [
                'horizontal',
                [30, [100, zone]],
                [70, [100, EPI_ZONE.LINE_LIST]],
              ],
            ],
          })),
          ...[EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP].map<EpiDashboardLayoutConfig>(zone => ({
            zones: [EPI_ZONE.TREE, zone],
            layouts: [
              [
                'vertical',
                [70, [100, EPI_ZONE.TREE]],
                [30, [100, zone]],
              ],
              [
                'vertical',
                [30, [100, zone]],
                [70, [100, EPI_ZONE.TREE]],
              ],
              [
                'horizontal',
                [70, [100, EPI_ZONE.TREE]],
                [30, [100, zone]],
              ],
              [
                'horizontal',
                [30, [100, zone]],
                [70, [100, EPI_ZONE.TREE]],
              ],
            ],
          })),
          {
            zones: [EPI_ZONE.MAP, EPI_ZONE.EPI_CURVE],
            layouts: [
              [
                'vertical',
                [70, [100, EPI_ZONE.MAP]],
                [30, [100, EPI_ZONE.EPI_CURVE]],
              ],
              [
                'vertical',
                [30, [100, EPI_ZONE.EPI_CURVE]],
                [70, [100, EPI_ZONE.MAP]],
              ],
              [
                'horizontal',
                [50, [100, EPI_ZONE.EPI_CURVE]],
                [50, [100, EPI_ZONE.MAP]],
              ],
              [
                'horizontal',
                [50, [100, EPI_ZONE.MAP]],
                [50, [100, EPI_ZONE.EPI_CURVE]],
              ],
            ],
          },

          // 3 ZONES: TREE, LINE_LIST, [EPI_ZONE.MAP / EPI_ZONE.EPI_CURVE]
          ...[EPI_ZONE.MAP, EPI_ZONE.EPI_CURVE].map<EpiDashboardLayoutConfig>(zone => ({
            zones: [EPI_ZONE.TREE, EPI_ZONE.LINE_LIST, zone],
            layouts: [
              [
                'vertical',
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
                [30, [100, zone]],
              ],
              [
                'vertical',
                [30, [100, zone]],
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
              ],
            ],
          })),
          // 3 ZONES: TREE, LINE_LIST, EPI_CURVE
          {
            zones: [EPI_ZONE.TREE, EPI_ZONE.LINE_LIST, EPI_ZONE.EPI_CURVE],
            layouts: [
              [
                'vertical',
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
                [30, [100, EPI_ZONE.EPI_CURVE]],
              ],
              [
                'vertical',
                [30, [100, EPI_ZONE.EPI_CURVE]],
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
              ],
            ],
          },
          // 3 ZONES:  MAP, EPI_CURVE, [EPI_ZONE.LINE_LIST / EPI_ZONE.TREE]
          ...[EPI_ZONE.LINE_LIST, EPI_ZONE.TREE].map<EpiDashboardLayoutConfig>(zone => ({
            zones: [zone, EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP],
            layouts: [
              [
                'vertical',
                [70, [100, zone]],
                [30, [50, EPI_ZONE.MAP], [50, EPI_ZONE.EPI_CURVE]],
              ],
              [
                'vertical',
                [70, [100, zone]],
                [30, [50, EPI_ZONE.EPI_CURVE], [50, EPI_ZONE.MAP]],
              ],
              [
                'horizontal',
                [70, [100, zone]],
                [30, [50, EPI_ZONE.MAP], [50, EPI_ZONE.EPI_CURVE]],
              ],
              [
                'horizontal',
                [70, [100, zone]],
                [30, [50, EPI_ZONE.EPI_CURVE], [50, EPI_ZONE.MAP]],
              ],
            ],
          })),

          // 4 ZONES
          {
            zones: [EPI_ZONE.LINE_LIST, EPI_ZONE.TREE, EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP],
            layouts: [
              [
                'vertical',
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
                [30, [50, EPI_ZONE.MAP], [50, EPI_ZONE.EPI_CURVE]],
              ],
              [
                'vertical',
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
                [30, [50, EPI_ZONE.EPI_CURVE], [50, EPI_ZONE.MAP]],
              ],
              [
                'vertical',
                [30, [50, EPI_ZONE.MAP], [50, EPI_ZONE.EPI_CURVE]],
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
              ],
              [
                'vertical',
                [30, [50, EPI_ZONE.EPI_CURVE], [50, EPI_ZONE.MAP]],
                [70, [50, EPI_ZONE.TREE], [50, EPI_ZONE.LINE_LIST]],
              ],
            ],
          },
        ],
      },
      spinner: {
        DEFAULT_TAKING_LONGER_TIMEOUT_MS: 8000,
        DEFAULT_CIRCULAR_PROGRESS_SIZE: 40,
      },
      layout: {
        SIDEBAR_MENU_WIDTH: 4,
        MAIN_CONTENT_ID: 'main-content',
      },
      userFeedback: {
        SHOW_USER_FEEDBACK_TOOLTIP_AFTER_MS: 2 * 60 * 1000, // 2 minutes
      },
      log: {
        LOG_INTERVAL_MS: 30000,
      },
      userInactivityConfirmation: {
        ALLOWED_IDLE_TIME_MS: 25 * 60 * 1000, // 25 minutes
        NOTIFICATION_TIME_MS: 5 * 60 * 1000, // 5 minutes
      },
      outages: {
        NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES: 8,
      },
      table: {
        DEFAULT_OVERSCAN_MAIN: 10,
        DEFAULT_OVERSCAN_REVERSE: 10,
      },
    };
    return config;
  }
}
