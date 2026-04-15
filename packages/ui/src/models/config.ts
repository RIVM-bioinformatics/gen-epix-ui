import type { ReactElement } from 'react';
import type {
  CircularProgressProps,
  Theme,
} from '@mui/material';
import type { TFunction } from 'i18next';
import type { CaseDbColType } from '@gen-epix/api-casedb';

import type {
  EPI_ZONE,
  EpiDashboardLayoutConfig,
} from './epi';
import type { APP } from './app';

export type ApplicationHeaderProps = {
  readonly fullHeight?: boolean;
  readonly fullWidth?: boolean;
  readonly singleAction?: boolean;
};

export interface Config {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ApplicationHeader: (props: ApplicationHeaderProps) => ReactElement;
  applicationName: string;
  consentDialog: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Content: () => ReactElement;
    getButtonLabel: (t: TFunction<'translation', undefined>) => string;
    getShouldShow: () => boolean;
    getTitle: (t: TFunction<'translation', undefined>) => string;
  };
  createFooter: (t: TFunction<'translation', undefined>) => FooterConfig;
  defaultRequestTimeout: number;
  enablePageEvents: boolean;
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
  getAPIBaseUrl: (app: APP) => string;
  getEnvironmentMessage: (t: TFunction<'translation', undefined>) => string;
  getSoftwareVersion: () => string;
  getTouchIconUrl: () => string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  HomePageIntroduction: () => ReactElement;
  i18n: {
    getCurrentLanguageCode: () => Promise<string> | string;
    languages: I18nConfig[];
    setNewLanguageCode: (code: string) => Promise<void>;
  };
  layout: {
    MAIN_CONTENT_ID: string;
    SIDEBAR_MENU_WIDTH: number;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LicenseInformation: () => ReactElement;
  log: {
    LOG_INTERVAL_MS: number;
  };
  login?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    AfterIdentityProviderSelection?: () => ReactElement;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    AfterLoginElement?: () => ReactElement;
  };
  nonce?: string;
  notifications: {
    autoHideAfterMs: number;
  };
  outages: {
    NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES: number;
  };
  queryClient: {
    retry: (failureCount: number, error: unknown) => boolean;
    retryDelay: (attempt: number) => number;
  };
  spinner: {
    DEFAULT_CIRCULAR_PROGRESS_SIZE: CircularProgressProps['size'];
    DEFAULT_TAKING_LONGER_TIMEOUT_MS: number;
  };
  table: {
    DEFAULT_OVERSCAN_MAIN: number;
    DEFAULT_OVERSCAN_REVERSE: number;
  };
  theme: Theme;
  trends: {
    homePage: {
      // yyyy-MM-dd
      getSinceDate: () => string;
      getSinceLabel: (t: TFunction<'translation', undefined>) => string;
    };
  };
  userFeedback: {
    SHOW_USER_FEEDBACK_TOOLTIP_AFTER_MS: number;
  };
  userInactivityConfirmation: {
    ALLOWED_IDLE_TIME_MS: number;
    NOTIFICATION_TIME_MS: number;
  };
}

export type FooterConfig = {
  sections: FooterSection[];
};

export type FooterSection = {
  readonly header: string;
  readonly items: FooterSectionItem[];
};

export type FooterSectionItem = {
  readonly href?: string;
  readonly label: string;
  readonly onClick?: () => void;
};

export type I18nConfig = {
  bundles: string[];
  code: string;
};
