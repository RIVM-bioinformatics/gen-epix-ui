import type { ReactElement } from 'react';
import type {
  CircularProgressProps,
  Theme,
} from '@mui/material';
import type { TFunction } from 'i18next';

import type { ColType } from '../api';

import type { EpiDashboardLayoutConfig } from './epi';

export type ApplicationHeaderProps = {
  readonly fullWidth?: boolean;
  readonly fullHeight?: boolean;
  readonly singleAction?: boolean;
};

export type ApplicationFooterProps = {
  readonly fullWidth?: boolean;
  readonly fullHeight?: boolean;
  readonly singleAction?: boolean;
};

export interface Config {
  enablePageVents: boolean;
  applicationName: string;
  theme: Theme;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ApplicationHeader: (props: ApplicationHeaderProps) => ReactElement;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ApplicationFooter: (props: ApplicationFooterProps) => ReactElement;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  HomePageIntroduction: () => ReactElement;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LicenseInformation: () => ReactElement;
  getSoftwareVersion: () => string;
  getAPIBaseUrl: () => string;
  getTouchIconUrl: () => string;
  defaultRequestTimeout: number;
  getEnvironmentMessage: (t: TFunction<'translation', undefined>) => string;
  consentDialog: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Content: () => ReactElement;
    getShouldShow: () => boolean;
    getTitle: (t: TFunction<'translation', undefined>) => string;
    getButtonLabel: (t: TFunction<'translation', undefined>) => string;
  };
  trends: {
    homePage: {
      getSinceLabel: (t: TFunction<'translation', undefined>) => string;
      // yyyy-MM-dd
      getSinceDate: () => string;
    };
  };
  notifications: {
    autoHideAfterMs: number;
  };
  epi: {
    ALLOWED_COL_TYPES_FOR_STRATIFICATION: ColType[];
    MAX_STRATIFICATION_UNIQUE_VALUES: number;
    DATA_MISSING_CHARACTER: string;
    STRATIFICATION_COLORS: string[];
    INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY: number;
  };
  epiMap: {
    MIN_PIE_CHART_RADIUS: number;
  };
  epiTree: {
    MIN_SCALE_WIDTH_PX: number;
    MAX_SCALE_WIDTH_PX: number;
    SCALE_INCREMENTS: number[];
    LEAF_DOT_RADIUS: number;
    ANCESTOR_DOT_RADIUS: number;
    ANCESTOR_DOT_RADIUS_HOVER_ZONE: number;
    MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL: number;
    REGULAR_FILL_COLOR_SUPPORT_LINE: string;
    HEADER_HEIGHT: number;
    TREE_PADDING_LEFT: number;
    TREE_PADDING_RIGHT: number;
    MAX_ZOOM_LEVEL: number;
    MIN_LINKED_ZOOM_LEVEL: number;
    MIN_UNLINKED_ZOOM_LEVEL: number;
    MIN_ZOOM_SPEED: number;
    MAX_ZOOM_SPEED: number;
    TAKING_LONGER_TIMEOUT_MS: number;
  };
  epiList: {
    TABLE_ROW_HEIGHT: number;
    MAX_COLUMN_WIDTH: number;
    REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT: number;
    CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS: number;
  };
  epiDashboard: {
    MIN_PANEL_WIDTH: number;
    MIN_PANEL_HEIGHT: number;
    LAYOUTS: EpiDashboardLayoutConfig[];
  };
  spinner: {
    DEFAULT_TAKING_LONGER_TIMEOUT_MS: number;
    DEFAULT_CIRCULAR_PROGRESS_SIZE: CircularProgressProps['size'];
  };
  layout: {
    SIDEBAR_MENU_WIDTH: number;
    MAIN_CONTENT_ID: string;
  };
  userFeedback: {
    SHOW_USER_FEEDBACK_TOOLTIP_AFTER_MS: number;
  };
  log: {
    LOG_INTERVAL_MS: number;
  };
  userInactivityConfirmation: {
    ALLOWED_IDLE_TIME_MS: number;
    NOTIFICATION_TIME_MS: number;
  };
  outages: {
    NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES: number;
  };
  table: {
    DEFAULT_OVERSCAN_MAIN: number;
    DEFAULT_OVERSCAN_REVERSE: number;
  };
}
