import type { TFunction } from 'i18next';
import type { CaseDbColType } from '@gen-epix/api-casedb';
import type { ConfigBase } from '@gen-epix/ui';
import type { Range } from 'colorjs.io';

import type {
  EpiDashboardArrangement,
  EpiDashboardArrangementWidgetAssignments,
  EpiWidgetsConfig,
} from './epi';

export interface CaseDbConfig extends ConfigBase {
  epi: {
    DATA_MISSING_CHARACTER: string;
    DOWNLOAD_SECTION_ORDER: string[];
    INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY: number;
    SEQDB_MAX_STORED_DISTANCE_FALLBACK: number;
    STRATIFICATION: {
      ALLOWED_COL_TYPES: CaseDbColType[];
      BASE_COLORS: string[];
      BASE_ORDERED_GRADIENT: Range;
      BASE_UNORDERED_GRADIENT: Range;
      EXTRA_GRADIENTS: [Range, ...Range[]];
      GRADIENT_COL_TYPES: CaseDbColType[];
      ITEM_MISSING_COLOR: string;
      MAX_ALLOWED_UNIQUE_VALUES: number;
    };
  };
  epiDashboard: {
    ARRANGEMENT_OPTIONS: { [key: string]: EpiDashboardArrangement };
    DEFAULT_ARRANGEMENT_KEY: string;
    DEFAULT_WIDGET_ASSIGNMENTS: { [key: string]: EpiDashboardArrangementWidgetAssignments };
    MIN_PANEL_HEIGHT: number;
    MIN_PANEL_WIDTH: number;
    WIDGETS: EpiWidgetsConfig;
  };
  epiLineList: {
    CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS: number;
    MAX_COLUMN_WIDTH: number;
    REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT: number;
    TABLE_ROW_HEIGHT: number;
  };
  epiMap: {
    MIN_PIE_CHART_RADIUS: number;
  };
  epiTree: {
    ANCESTOR_DOT_RADIUS: number;
    HEADER_HEIGHT: number;
    INITIAL_UNLINKED_ZOOM_LEVEL: number;
    LEAF_DOT_RADIUS: number;
    LINKED_SCROLL_DEBOUNCE_DELAY_MS: number;
    MAX_SCALE_WIDTH_PX: number;
    MAX_ZOOM_LEVEL: number;
    MAX_ZOOM_SPEED: number;
    MIN_SCALE_WIDTH_PX: number;
    MIN_ZOOM_LEVEL: number;
    MIN_ZOOM_SPEED: number;
    MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL: number;
    PANNING_THRESHOLD: number;
    REGULAR_FILL_COLOR_SUPPORT_LINE: string;
    SCALE_INCREMENTS: number[];
    TAKING_LONGER_TIMEOUT_MS: number;
    TREE_PADDING: number;
  };
  trends: {
    homePage: {
      // yyyy-MM-dd
      getSinceDate: () => string;
      getSinceLabel: (t: TFunction<'translation', undefined>) => string;
    };
  };
}
