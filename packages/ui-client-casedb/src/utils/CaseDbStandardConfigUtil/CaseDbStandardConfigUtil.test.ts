import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import i18next from 'i18next';
import { I18nService } from '@gen-epix/ui-client-common/classes/services/I18nService';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { DASHBOARD_COMPONENT_NAME } from '../../constants/dashboard.constants';

import { CaseDbStandardConfigUtil } from './CaseDbStandardConfigUtil';

const createConfig = () => CaseDbStandardConfigUtil.createConfig();

const mockLocation = (href: string): void => {
  vi.spyOn(WindowService, 'getInstance').mockReturnValue({
    window: { document: { location: { href } } },
  } as unknown as WindowService);
};

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          'since last year': 'since last year',
        },
      },
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CaseDbStandardConfigUtil.createConfig', () => {
  it('provides standard dashboard layouts, widget settings, and epidemiology defaults', () => {
    const config = createConfig();

    expect(config.dashboard.DEFAULT_ARRANGEMENT_KEY).toBe('1');
    expect(config.dashboard.ARRANGEMENT_OPTIONS).toHaveProperty('1');
    expect(config.dashboard.ARRANGEMENT_OPTIONS).toHaveProperty('6');
    expect(config.dashboard.DEFAULT_WIDGET_ASSIGNMENTS['1']).toEqual({
      A: DASHBOARD_COMPONENT_NAME.TREE,
      B: DASHBOARD_COMPONENT_NAME.LINE_LIST,
      C: DASHBOARD_COMPONENT_NAME.MAP,
      D: DASHBOARD_COMPONENT_NAME.EPI_CURVE,
    });
    expect(config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.TREE].dataPersistableDefaultValues).toEqual({
      treeConfiguration: null,
    });
    expect(config.epi.INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY).toBe(5);
    expect(config.epi.STRATIFICATION.EXTRA_GRADIENTS).toHaveLength(4);
    expect(config.lineList.TABLE_ROW_HEIGHT).toBe(24);
  });

  it('creates footer language actions through the i18n service', () => {
    const config = createConfig();
    const emit = vi.spyOn(container.resolve(I18nService), 'emit').mockImplementation(() => undefined);
    const languageItems = config.createFooter().sections[2].items;

    languageItems[0].onClick();
    languageItems[1].onClick();

    expect(emit).toHaveBeenNthCalledWith(1, 'onUserLanguageChange', 'en');
    expect(emit).toHaveBeenNthCalledWith(2, 'onUserLanguageChange', 'nl');
  });

  it.each([
    ['https://127.0.0.1:5173', 'https://127.0.0.1:5010'],
    ['https://localhost:5173', 'https://localhost:5010'],
    ['https://example.org', ''],
  ])('selects the API base URL for %s', (href, expectedBaseUrl) => {
    const config = createConfig();
    mockLocation(href);

    expect(config.getAPIBaseUrl()).toBe(expectedBaseUrl);
  });

  it.each([
    'https://127.0.0.1:5173',
    'https://localhost:5173',
    'https://example.org',
  ])('returns the local environment label for %s', (href) => {
    const config = createConfig();
    mockLocation(href);

    expect(config.getEnvironmentMessage()).toBe('localhost');
  });

  it('computes the homepage trend date and label', () => {
    const config = createConfig();

    expect(config.trends.homePage.getSinceDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(config.trends.homePage.getSinceLabel(i18next.t)).toBe('since last year');
  });
});
