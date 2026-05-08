import {
  format,
  subDays,
} from 'date-fns';
import { CaseDbColType } from '@gen-epix/api-casedb';
import { DemoConfigUtil } from '@gen-epix/ui';

import type { EpiDashboardLayoutConfig } from '../../models/epi';
import { EPI_ZONE } from '../../models/epi';
import type { CaseDbConfig } from '../../models/config';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

export class CaseDbDemoConfigUtil {
  public static createConfig(): CaseDbConfig {

    const PANEL_ZONES = [EPI_ZONE.EPI_CURVE, EPI_ZONE.LINE_LIST, EPI_ZONE.MAP, EPI_ZONE.TREE];
    const config: CaseDbConfig = {
      ...DemoConfigUtil.createConfig(),
      applicationName: 'Gen-EpiX',
      epi: {
        ALLOWED_COL_TYPES_FOR_STRATIFICATION: [
          CaseDbColType.NOMINAL,
          CaseDbColType.TEXT,
          CaseDbColType.ORDINAL,
          CaseDbColType.GEO_REGION,
          CaseDbColType.ORGANIZATION,
        ],
        DATA_MISSING_CHARACTER: '·',
        DOWNLOAD_SECTION_ORDER: [EPI_ZONE.LINE_LIST, EPI_ZONE.TREE, EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP],
        INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY: 5,
        SEQDB_MAX_STORED_DISTANCE_FALLBACK: 20,
        STRATIFICATION_COLOR_ITEM_MISSING: '#000',
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
                [50, [100, EPI_ZONE.TREE]],
                [50, [100, EPI_ZONE.LINE_LIST]],
              ],
            ],
            zones: [EPI_ZONE.LINE_LIST, EPI_ZONE.TREE],
          },
          ...[EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP].map<EpiDashboardLayoutConfig>(zone => ({
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
            zones: [EPI_ZONE.LINE_LIST, zone],
          })),
          ...[EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP].map<EpiDashboardLayoutConfig>(zone => ({
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
            zones: [EPI_ZONE.TREE, zone],
          })),
          {
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
            zones: [EPI_ZONE.MAP, EPI_ZONE.EPI_CURVE],
          },

          // 3 ZONES: TREE, LINE_LIST, [EPI_ZONE.MAP / EPI_ZONE.EPI_CURVE]
          ...[EPI_ZONE.MAP, EPI_ZONE.EPI_CURVE].map<EpiDashboardLayoutConfig>(zone => ({
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
            zones: [EPI_ZONE.TREE, EPI_ZONE.LINE_LIST, zone],
          })),
          // 3 ZONES: TREE, LINE_LIST, EPI_CURVE
          {
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
            zones: [EPI_ZONE.TREE, EPI_ZONE.LINE_LIST, EPI_ZONE.EPI_CURVE],
          },
          // 3 ZONES:  MAP, EPI_CURVE, [EPI_ZONE.LINE_LIST / EPI_ZONE.TREE]
          ...[EPI_ZONE.LINE_LIST, EPI_ZONE.TREE].map<EpiDashboardLayoutConfig>(zone => ({
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
            zones: [zone, EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP],
          })),

          // 4 ZONES
          {
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
            zones: [EPI_ZONE.LINE_LIST, EPI_ZONE.TREE, EPI_ZONE.EPI_CURVE, EPI_ZONE.MAP],
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
}
