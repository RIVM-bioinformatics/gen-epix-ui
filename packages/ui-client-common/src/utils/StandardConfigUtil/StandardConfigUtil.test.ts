import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { StandardConfigUtil } from './StandardConfigUtil';

const createAxiosError = (status: number, code?: string) => ({
  code,
  isAxiosError: true,
  response: { status },
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('StandardConfigUtil.createConfig', () => {
  it('provides default application content and configuration values', () => {
    vi.stubEnv('DEV', true);

    const config = StandardConfigUtil.createConfig();
    const footer = config.createFooter();

    expect(config.ApplicationHeader({})).toBeNull();
    expect(config.HomePageIntroduction()).toBeNull();
    expect(config.LicenseInformation()).toBeNull();
    expect(config.consentDialog.Content()).toBeNull();
    expect(config.consentDialog.getButtonLabel()).toBe('I consent');
    expect(config.consentDialog.getShouldShow()).toBe(false);
    expect(config.consentDialog.getTitle()).toBe('Consent');
    expect(config.getAPIBaseUrl()).toBe('development');
    expect(config.getEnvironmentMessage()).toBe('development');
    expect(config.getSoftwareVersion()).toBe('development');
    expect(config.getTouchIconUrl()).toBe('/touch-icon.png');
    expect(config.applicationName).toBe('Gen-EpiX');
    expect(config.defaultRequestTimeout).toBe(30000);
    expect(config.enablePageEvents).toBe(true);
    expect(config.layout).toEqual({
      MAIN_CONTENT_ID: 'main-content',
      SIDEBAR_MENU_WIDTH: 4,
    });
    expect(config.createFooter().sections).toHaveLength(3);
    expect(footer.sections[2].items[0].onClick?.()).toBeNull();
    expect(config.queryClient.retry(0, createAxiosError(500))).toBe(false);
    expect(config.queryClient.retryDelay(1)).toBe(3000);
    expect(config.queryClient.retryDelay(2)).toBe(12000);
    expect(config.queryClient.retryDelay(4)).toBe(30000);
    expect(config.spinner).toEqual({
      DEFAULT_CIRCULAR_PROGRESS_SIZE: 40,
      DEFAULT_TAKING_LONGER_TIMEOUT_MS: 8000,
    });
    expect(config.log.LOG_INTERVAL_MS).toBe(30000);
    expect(config.notifications.autoHideAfterMs).toBe(5000);
    expect(config.outages.NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES).toBe(8);
    expect(config.table).toEqual({
      CONDENSED_WIDTH_PX: 150,
      DEFAULT_OVERSCAN_MAIN: 10,
      DEFAULT_OVERSCAN_REVERSE: 10,
    });
    expect(config.userFeedback.SHOW_USER_FEEDBACK_TOOLTIP_AFTER_MS).toBe(120000);
    expect(config.userInactivityConfirmation).toEqual({
      ALLOWED_IDLE_TIME_MS: 1500000,
      NOTIFICATION_TIME_MS: 300000,
    });
  });

  it('configures production query retries for server errors and timeouts only', () => {
    vi.stubEnv('DEV', false);

    const config = StandardConfigUtil.createConfig();

    expect(config.consentDialog.getShouldShow()).toBe(true);
    expect(config.queryClient.retry(0, createAxiosError(500))).toBe(true);
    expect(config.queryClient.retry(2, createAxiosError(500))).toBe(true);
    expect(config.queryClient.retry(3, createAxiosError(500))).toBe(false);
    expect(config.queryClient.retry(1, createAxiosError(400, 'ECONNABORTED'))).toBe(true);
    expect(config.queryClient.retry(1, createAxiosError(400))).toBe(false);
    expect(config.queryClient.retry(1, new Error('request failed'))).toBe(false);
    expect(config.queryClient.retryDelay(3)).toBe(24000);
    expect(config.queryClient.retryDelay(10)).toBe(30000);
  });
});
