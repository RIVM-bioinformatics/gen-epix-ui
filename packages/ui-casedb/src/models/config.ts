import type { TFunction } from 'i18next';
import type { CaseDbColType } from '@gen-epix/api-casedb';
import type { ConfigBase } from '@gen-epix/ui';

import type {
  EPI_ZONE,
  EpiDashboardLayoutConfig,
} from './epi';

export interface CaseDbConfig extends ConfigBase {
  epi: {
    ALLOWED_COL_TYPES_FOR_STRATIFICATION: CaseDbColType[];
    DATA_MISSING_CHARACTER: string;
    DOWNLOAD_SECTION_ORDER: EPI_ZONE[];
    INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY: number;
    SEQDB_MAX_STORED_DISTANCE_FALLBACK: number;
    STRATIFICATION_COLOR_ITEM_MISSING: string;
    STRATIFICATION_COLORS: string[];
  };
  epiDashboard: {
    LAYOUTS: EpiDashboardLayoutConfig[];
    MIN_PANEL_HEIGHT: number;
    MIN_PANEL_WIDTH: number;
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
