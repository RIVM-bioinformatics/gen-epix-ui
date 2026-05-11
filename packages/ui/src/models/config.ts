import type { ReactElement } from 'react';
import type {
  CircularProgressProps,
  Theme,
} from '@mui/material';
import type { TFunction } from 'i18next';

export type ApplicationHeaderProps = {
  readonly fullHeight?: boolean;
  readonly fullWidth?: boolean;
  readonly singleAction?: boolean;
};


export interface ConfigBase {
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
  getAPIBaseUrl: () => string;
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
