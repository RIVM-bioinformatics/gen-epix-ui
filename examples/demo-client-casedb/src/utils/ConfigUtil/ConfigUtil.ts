import {
  format,
  subDays,
} from 'date-fns';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type { FormFieldDefinition } from '@gen-epix/ui';
import {
  AxiosUtil,
  FORM_FIELD_DEFINITION_TYPE,
  I18nManager,
  WindowManager,
} from '@gen-epix/ui';
import type {
  CaseDbConfig,
  EpiDashboardEpiCurveSettings,
  EpiDashboardTreeSettings,
} from '@gen-epix/ui-casedb';
import {
  createCaseDbDemoTheme,
  EPI_DASHBOARD_ARRANGEMENT_ORIENTATION,
  EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
  EPI_WIDGET_NAME,
  EpiCurveWidget,
  EpiLineListWidget,
  EpiMapWidget,
  EpiTreeWidget,
} from '@gen-epix/ui-casedb';
import Color from 'colorjs.io';
import type { Range } from 'colorjs.io';
import { t } from 'i18next';

import { ApplicationHeader } from '../../components/ApplicationHeader';
import { ConsentDialogContent } from '../../components/ConsentDialogContent';
import { HomePageIntroduction } from '../../components/HomePageIntroduction';
import { LicenseInformation } from '../../components/LicenseInformation';


export class ConfigUtil {
  public static createConfig(): CaseDbConfig {
    const onEnglishClick = () => {
      I18nManager.getInstance().emit('onUserLanguageChange', 'en');
    };

    const onDutchClick = () => {
      I18nManager.getInstance().emit('onUserLanguageChange', 'nl');
    };

    const config: CaseDbConfig = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ApplicationHeader,
      applicationName: 'Gen-EpiX',
      consentDialog: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Content: ConsentDialogContent,
        getButtonLabel: () => t`I consent`,
        getShouldShow: () => !import.meta.env.DEV,
        getTitle: () => t`Consent`,
      },
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
      defaultRequestTimeout: 30000,
      enablePageEvents: true,
      epi: {
        DATA_MISSING_CHARACTER: '·',
        DOWNLOAD_SECTION_ORDER: [EPI_WIDGET_NAME.LINE_LIST, EPI_WIDGET_NAME.TREE, EPI_WIDGET_NAME.EPI_CURVE, EPI_WIDGET_NAME.MAP],
        INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY: 5,
        SEQDB_MAX_STORED_DISTANCE_FALLBACK: 20,
        STRATIFICATION: {
          ALLOWED_COL_TYPES: [
            CaseDbColType.DECIMAL_0,
            CaseDbColType.DECIMAL_1,
            CaseDbColType.DECIMAL_2,
            CaseDbColType.DECIMAL_3,
            CaseDbColType.DECIMAL_4,
            CaseDbColType.DECIMAL_5,
            CaseDbColType.DECIMAL_6,
            CaseDbColType.GEO_REGION,
            CaseDbColType.INTERVAL,
            CaseDbColType.NOMINAL,
            CaseDbColType.ORDINAL,
            CaseDbColType.ORGANIZATION,
            CaseDbColType.TEXT,
            CaseDbColType.TIME_WEEK,
            CaseDbColType.TIME_MONTH,
            CaseDbColType.TIME_QUARTER,
            CaseDbColType.TIME_YEAR,
          ],
          BASE_COLORS: [
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
          BASE_ORDERED_GRADIENT: ConfigUtil.createStratificationBaseOrderedGradient(),
          BASE_UNORDERED_GRADIENT: ConfigUtil.createStratificationBaseUnorderedGradient(),
          EXTRA_GRADIENTS: ConfigUtil.createStratificationExtraGradients(),
          GRADIENT_COL_TYPES: [
            CaseDbColType.ORDINAL,
            CaseDbColType.INTERVAL,
            CaseDbColType.DECIMAL_0,
            CaseDbColType.DECIMAL_1,
            CaseDbColType.DECIMAL_2,
            CaseDbColType.DECIMAL_3,
            CaseDbColType.DECIMAL_4,
            CaseDbColType.DECIMAL_5,
            CaseDbColType.DECIMAL_6,
            CaseDbColType.TIME_DAY,
            CaseDbColType.TIME_WEEK,
            CaseDbColType.TIME_MONTH,
            CaseDbColType.TIME_QUARTER,
            CaseDbColType.TIME_YEAR,
          ],
          ITEM_MISSING_COLOR: '#aaa',
          MAX_ALLOWED_UNIQUE_VALUES: 50,
        },
      },
      epiDashboard: {
        ARRANGEMENT_OPTIONS: {
          1: {
            cells: [{
              cells: [{ name: 'A', size: 50 }, { name: 'B', size: 50 }],
              orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
              size: 70,
            }, {
              cells: [{ name: 'C', size: 50 }, { name: 'D', size: 50 }],
              orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
              size: 30,
            }],
            orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
            size: 100,
          },
          2: {
            cells: [{
              cells: [{ name: 'A', size: 50 }, { name: 'B', size: 50 }],
              orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
              size: 70,
            }, {
              cells: [{ name: 'C', size: 34 }, { name: 'D', size: 33 }, { name: 'E', size: 33 }],
              orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
              size: 30,
            }],
            orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
            size: 100,
          },
          3: {
            cells: [{ name: 'A', size: 50 }, { name: 'B', size: 50 }],
            orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
            size: 100,
          },
          4: {
            cells: [{ name: 'A', size: 50 }, { name: 'B', size: 50 }],
            orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
            size: 100,
          },
          5: {
            cells: [
              { name: 'A', size: 50 },
              {
                cells: [{ name: 'C', size: 50 }, { name: 'D', size: 50 }],
                orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
                size: 50,
              }],
            orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
            size: 100,
          },
          6: {
            cells: [
              {
                cells: [{ name: 'C', size: 50 }, { name: 'D', size: 50 }],
                orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
                size: 50,
              },
              { name: 'A', size: 50 },
            ],
            orientation: EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
            size: 100,
          },
        },
        DEFAULT_ARRANGEMENT_KEY: '1',
        DEFAULT_WIDGET_ASSIGNMENTS: {
          1: {
            A: EPI_WIDGET_NAME.TREE,
            B: EPI_WIDGET_NAME.LINE_LIST,
            C: EPI_WIDGET_NAME.MAP,
            D: EPI_WIDGET_NAME.EPI_CURVE,
          },
          2: {
            A: EPI_WIDGET_NAME.TREE,
            B: EPI_WIDGET_NAME.LINE_LIST,
            C: EPI_WIDGET_NAME.MAP,
            D: EPI_WIDGET_NAME.EPI_CURVE,
            E: undefined,
          },
          3: {
            A: EPI_WIDGET_NAME.TREE,
            B: EPI_WIDGET_NAME.LINE_LIST,
          },
          4: {
            A: EPI_WIDGET_NAME.LINE_LIST,
            B: EPI_WIDGET_NAME.EPI_CURVE,
          },
          5: {
            A: EPI_WIDGET_NAME.LINE_LIST,
            B: EPI_WIDGET_NAME.EPI_CURVE,
            C: EPI_WIDGET_NAME.MAP,
          },
          6: {
            A: EPI_WIDGET_NAME.LINE_LIST,
            B: EPI_WIDGET_NAME.EPI_CURVE,
            C: EPI_WIDGET_NAME.MAP,
          },
        },
        MIN_PANEL_HEIGHT: 30,
        MIN_PANEL_WIDTH: 30,
        WIDGETS: {
          [EPI_WIDGET_NAME.EPI_CURVE]: {
            component: EpiCurveWidget,
            configDefaultValues: {
              isIncludeMissingValuesInAreaChartEnabled: false,
            } satisfies EpiDashboardEpiCurveSettings,
            configFormFieldsDefinitions: [
              {
                definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
                label: t`Include missing values in area chart`,
                name: 'isIncludeMissingValuesInAreaChartEnabled',
              },
            ] satisfies FormFieldDefinition<EpiDashboardEpiCurveSettings>[],
            widgetLabel: t`Epi Curve`,
          },
          [EPI_WIDGET_NAME.LINE_LIST]: {
            component: EpiLineListWidget,
            widgetLabel: t`Line List`,
          },
          [EPI_WIDGET_NAME.MAP]: {
            component: EpiMapWidget,
            widgetLabel: t`Map`,
          },
          [EPI_WIDGET_NAME.TREE]: {
            component: EpiTreeWidget,
            configDefaultValues: {
              isShowDistancesEnabled: true,
              isShowSupportLinesWhenUnlinkedEnabled: true,
            } satisfies EpiDashboardTreeSettings,
            configFormFieldsDefinitions: [
              {
                definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
                label: t`Show distances`,
                name: 'isShowDistancesEnabled',
              },
              {
                definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
                label: t`Show support lines when unlinked`,
                name: 'isShowSupportLinesWhenUnlinkedEnabled',
              },
            ] satisfies FormFieldDefinition<EpiDashboardTreeSettings>[],
            constraints: [{
              require_adjacent: {
                direction: EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST,
                widgetName: EPI_WIDGET_NAME.LINE_LIST,
              },
            }],
            widgetLabel: t`Phylogenetic Tree`,
          },
        },
      },
      epiLineList: {
        CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS: 1000,
        MAX_COLUMN_WIDTH: 400,
        REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT: 36,
        TABLE_ROW_HEIGHT: 24,
      },
      epiMap: {
        MIN_PIE_CHART_RADIUS: 4,
      },
      epiTree: {
        ANCESTOR_DOT_RADIUS: 3,
        HEADER_HEIGHT: 32,
        INITIAL_UNLINKED_ZOOM_LEVEL: 1.05,
        LEAF_DOT_RADIUS: 5,
        LINKED_SCROLL_DEBOUNCE_DELAY_MS: 500,
        MAX_SCALE_WIDTH_PX: 144,
        MAX_ZOOM_LEVEL: 20,
        MAX_ZOOM_SPEED: 0.25,
        MIN_SCALE_WIDTH_PX: 48,
        MIN_ZOOM_LEVEL: 0.1,
        MIN_ZOOM_SPEED: 0.1,
        MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL: 1,
        PANNING_THRESHOLD: 25,
        REGULAR_FILL_COLOR_SUPPORT_LINE: '#E0E6F1',
        SCALE_INCREMENTS: [1, 2, 5, 10, 20, 50],
        TAKING_LONGER_TIMEOUT_MS: 10000,
        TREE_PADDING: 20,
      },
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
      theme: createCaseDbDemoTheme('light'),
      trends: {
        homePage: {
          getSinceDate: () => format(subDays(new Date().toISOString(), 365), 'yyyy-MM-dd'),
          getSinceLabel: () => t`since last year`,
        },
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

  private static createStratificationBaseOrderedGradient(): Range {
    const color1 = new Color('rebeccapurple');
    const color2 = new Color('lch', [95, 95, 95 + 720]);
    return color1.range(color2, {
      outputSpace: 'srgb',
      space: 'lch', // interpolation space
    });
  }

  private static createStratificationBaseUnorderedGradient(): Range {
    const color1 = new Color('rebeccapurple');
    const color2 = new Color('lch', [95, 95, 95 + 720]);
    return color1.range(color2, { hue: 'raw', outputSpace: 'srgb', space: 'lch' });
  }

  private static createStratificationExtraGradients(): [Range, ...Range[]] {
    const gradients: Range[] = [];

    const color1 = new Color('rebeccapurple');
    const color2 = new Color('lch', [85, 85, 85 + 720]);
    gradients.push(color1.range(color2, { hue: 'longer', outputSpace: 'srgb', space: 'lch' }));
    gradients.push(color1.range(color2, { hue: 'shorter', outputSpace: 'srgb', space: 'lch' }));
    gradients.push(color1.range(color2, { hue: 'increasing', outputSpace: 'srgb', space: 'lch' }));
    gradients.push(color1.range(color2, { hue: 'decreasing', outputSpace: 'srgb', space: 'lch' }));

    return gradients as [Range, ...Range[]];
  }
}
