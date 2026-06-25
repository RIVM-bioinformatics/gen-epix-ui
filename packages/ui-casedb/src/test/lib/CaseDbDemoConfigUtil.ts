import {
  format,
  subDays,
} from 'date-fns';
import { CaseDbColType } from '@gen-epix/api-casedb';
import { DemoConfigUtil } from '@gen-epix/ui';
import Color from 'colorjs.io';
import type { Range } from 'colorjs.io';

import type { EpiDashboardLayoutConfig } from '../../models/epi';
import type { CaseDbConfig } from '../../models/config';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';
import { EPI_WIDGET_NAME } from '../../data/epi';

export class CaseDbDemoConfigUtil {
  public static createConfig(): CaseDbConfig {

    const PANEL_ZONES = [EPI_WIDGET_NAME.EPI_CURVE, EPI_WIDGET_NAME.LINE_LIST, EPI_WIDGET_NAME.MAP, EPI_WIDGET_NAME.TREE];
    const config: CaseDbConfig = {
      ...DemoConfigUtil.createConfig(),
      applicationName: 'Gen-EpiX',
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
          ],
          BASE_COLORS: [
            '#063F7B',
            '#7B0603',
            '#3F7B06',
            '#7B0603',
            '#063F7B',
            '#3F4006',
            '#39063F',
            '#3F4006',
            '#39063F',
            '#3F4006',
            '#39063F',
            '#3F4006',
          ],
          BASE_ORDERED_GRADIENT: CaseDbDemoConfigUtil.createStratificationBaseOrderedGradient(),
          BASE_UNORDERED_GRADIENT: CaseDbDemoConfigUtil.createStratificationBaseUnorderedGradient(),
          EXTRA_GRADIENTS: CaseDbDemoConfigUtil.createStratificationExtraGradients(),
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
          ],
          ITEM_MISSING_COLOR: '#CCCCCC',
          MAX_ALLOWED_UNIQUE_VALUES: 100,
        },
      },
      epiDashboard: {
        LAYOUTS: [
          // 1 ZONE
          ...PANEL_ZONES.map<EpiDashboardLayoutConfig>(zone => ({
            layouts: [
              [
                'vertical',
                [100, [100, zone]],
              ],
            ],
            zones: [zone],
          })),

          // 2 ZONES
          {
            layouts: [
              [
                'horizontal',
                [50, [100, EPI_WIDGET_NAME.TREE]],
                [50, [100, EPI_WIDGET_NAME.LINE_LIST]],
              ],
            ],
            zones: [EPI_WIDGET_NAME.LINE_LIST, EPI_WIDGET_NAME.TREE],
          },
          ...[EPI_WIDGET_NAME.EPI_CURVE, EPI_WIDGET_NAME.MAP].map<EpiDashboardLayoutConfig>(zone => ({
            layouts: [
              [
                'vertical',
                [70, [100, EPI_WIDGET_NAME.LINE_LIST]],
                [30, [100, zone]],
              ],
              [
                'vertical',
                [30, [100, zone]],
                [70, [100, EPI_WIDGET_NAME.LINE_LIST]],
              ],
              [
                'horizontal',
                [70, [100, EPI_WIDGET_NAME.LINE_LIST]],
                [30, [100, zone]],
              ],
              [
                'horizontal',
                [30, [100, zone]],
                [70, [100, EPI_WIDGET_NAME.LINE_LIST]],
              ],
            ],
            zones: [EPI_WIDGET_NAME.LINE_LIST, zone],
          })),
          ...[EPI_WIDGET_NAME.EPI_CURVE, EPI_WIDGET_NAME.MAP].map<EpiDashboardLayoutConfig>(zone => ({
            layouts: [
              [
                'vertical',
                [70, [100, EPI_WIDGET_NAME.TREE]],
                [30, [100, zone]],
              ],
              [
                'vertical',
                [30, [100, zone]],
                [70, [100, EPI_WIDGET_NAME.TREE]],
              ],
              [
                'horizontal',
                [70, [100, EPI_WIDGET_NAME.TREE]],
                [30, [100, zone]],
              ],
              [
                'horizontal',
                [30, [100, zone]],
                [70, [100, EPI_WIDGET_NAME.TREE]],
              ],
            ],
            zones: [EPI_WIDGET_NAME.TREE, zone],
          })),
          {
            layouts: [
              [
                'vertical',
                [70, [100, EPI_WIDGET_NAME.MAP]],
                [30, [100, EPI_WIDGET_NAME.EPI_CURVE]],
              ],
              [
                'vertical',
                [30, [100, EPI_WIDGET_NAME.EPI_CURVE]],
                [70, [100, EPI_WIDGET_NAME.MAP]],
              ],
              [
                'horizontal',
                [50, [100, EPI_WIDGET_NAME.EPI_CURVE]],
                [50, [100, EPI_WIDGET_NAME.MAP]],
              ],
              [
                'horizontal',
                [50, [100, EPI_WIDGET_NAME.MAP]],
                [50, [100, EPI_WIDGET_NAME.EPI_CURVE]],
              ],
            ],
            zones: [EPI_WIDGET_NAME.MAP, EPI_WIDGET_NAME.EPI_CURVE],
          },

          // 3 ZONES: TREE, LINE_LIST, [EPI_WIDGET_NAME.MAP / EPI_WIDGET_NAME.EPI_CURVE]
          ...[EPI_WIDGET_NAME.MAP, EPI_WIDGET_NAME.EPI_CURVE].map<EpiDashboardLayoutConfig>(zone => ({
            layouts: [
              [
                'vertical',
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
                [30, [100, zone]],
              ],
              [
                'vertical',
                [30, [100, zone]],
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
              ],
            ],
            zones: [EPI_WIDGET_NAME.TREE, EPI_WIDGET_NAME.LINE_LIST, zone],
          })),
          // 3 ZONES: TREE, LINE_LIST, EPI_CURVE
          {
            layouts: [
              [
                'vertical',
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
                [30, [100, EPI_WIDGET_NAME.EPI_CURVE]],
              ],
              [
                'vertical',
                [30, [100, EPI_WIDGET_NAME.EPI_CURVE]],
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
              ],
            ],
            zones: [EPI_WIDGET_NAME.TREE, EPI_WIDGET_NAME.LINE_LIST, EPI_WIDGET_NAME.EPI_CURVE],
          },
          // 3 ZONES:  MAP, EPI_CURVE, [EPI_WIDGET_NAME.LINE_LIST / EPI_WIDGET_NAME.TREE]
          ...[EPI_WIDGET_NAME.LINE_LIST, EPI_WIDGET_NAME.TREE].map<EpiDashboardLayoutConfig>(zone => ({
            layouts: [
              [
                'vertical',
                [70, [100, zone]],
                [30, [50, EPI_WIDGET_NAME.MAP], [50, EPI_WIDGET_NAME.EPI_CURVE]],
              ],
              [
                'vertical',
                [70, [100, zone]],
                [30, [50, EPI_WIDGET_NAME.EPI_CURVE], [50, EPI_WIDGET_NAME.MAP]],
              ],
              [
                'horizontal',
                [70, [100, zone]],
                [30, [50, EPI_WIDGET_NAME.MAP], [50, EPI_WIDGET_NAME.EPI_CURVE]],
              ],
              [
                'horizontal',
                [70, [100, zone]],
                [30, [50, EPI_WIDGET_NAME.EPI_CURVE], [50, EPI_WIDGET_NAME.MAP]],
              ],
            ],
            zones: [zone, EPI_WIDGET_NAME.EPI_CURVE, EPI_WIDGET_NAME.MAP],
          })),

          // 4 ZONES
          {
            layouts: [
              [
                'vertical',
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
                [30, [50, EPI_WIDGET_NAME.MAP], [50, EPI_WIDGET_NAME.EPI_CURVE]],
              ],
              [
                'vertical',
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
                [30, [50, EPI_WIDGET_NAME.EPI_CURVE], [50, EPI_WIDGET_NAME.MAP]],
              ],
              [
                'vertical',
                [30, [50, EPI_WIDGET_NAME.MAP], [50, EPI_WIDGET_NAME.EPI_CURVE]],
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
              ],
              [
                'vertical',
                [30, [50, EPI_WIDGET_NAME.EPI_CURVE], [50, EPI_WIDGET_NAME.MAP]],
                [70, [50, EPI_WIDGET_NAME.TREE], [50, EPI_WIDGET_NAME.LINE_LIST]],
              ],
            ],
            zones: [EPI_WIDGET_NAME.LINE_LIST, EPI_WIDGET_NAME.TREE, EPI_WIDGET_NAME.EPI_CURVE, EPI_WIDGET_NAME.MAP],
          },
        ],
        MIN_PANEL_HEIGHT: 30,
        MIN_PANEL_WIDTH: 30,
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
      theme: createCaseDbDemoTheme('light'),
      trends: {
        homePage: {
          getSinceDate: () => format(subDays(new Date().toISOString(), 365), 'yyyy-MM-dd'),
          getSinceLabel: () => 'since last year',
        },
      },
    };
    return config;
  }

  private static createStratificationBaseOrderedGradient(): Range {
    const color1 = new Color('p3', [0, 1, 0]);
    const color2 = new Color('p3', [1, 0, 0]);
    return color1.range(color2, {
      outputSpace: 'srgb',
      space: 'lch', // interpolation space
    });
  }

  private static createStratificationBaseUnorderedGradient(): Range {
    const color1 = new Color('rebeccapurple');
    const color2 = new Color('lch', [85, 85, 85 + 720]);
    return color1.range(color2, { hue: 'raw', outputSpace: 'srgb', space: 'lch' });
  }

  private static createStratificationExtraGradients(): [Range, ...Range[]] {
    const gradients: Range[] = [];

    (() => {
      const color1 = new Color('rebeccapurple');
      const color2 = new Color('lch', [85, 85, 85 + 720]);
      gradients.push(color1.range(color2, { hue: 'longer', outputSpace: 'srgb', space: 'lch' }));
      gradients.push(color1.range(color2, { hue: 'shorter', outputSpace: 'srgb', space: 'lch' }));
      gradients.push(color1.range(color2, { hue: 'increasing', outputSpace: 'srgb', space: 'lch' }));
      gradients.push(color1.range(color2, { hue: 'decreasing', outputSpace: 'srgb', space: 'lch' }));
    })();

    return gradients as [Range, ...Range[]];
  }
}
