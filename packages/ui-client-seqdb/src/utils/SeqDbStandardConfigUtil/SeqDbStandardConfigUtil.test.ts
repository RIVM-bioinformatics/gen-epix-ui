import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import { I18nService } from '@gen-epix/ui-client-common/classes/services/I18nService';
import i18next from 'i18next';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { SeqDbStandardConfigUtil } from './SeqDbStandardConfigUtil';

const mockLocation = (href: string): void => {
  vi.spyOn(container.resolve(WindowService), 'window', 'get').mockReturnValue({
    document: { location: { href } },
  } as unknown as typeof globalThis & Window);
};

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SeqDbStandardConfigUtil.createConfig', () => {
  it('preserves standard configuration while providing the sequence database footer', () => {
    const config = SeqDbStandardConfigUtil.createConfig();
    const footer = config.createFooter();

    expect(config.applicationName).toBe('Gen-EpiX');
    expect(config.defaultRequestTimeout).toBe(30000);
    expect(config.enablePageEvents).toBe(false);
    expect(footer.sections.map(section => section.header)).toEqual([
      'Contact',
      'About',
      'Languages',
    ]);
    expect(footer.sections[0].items).toEqual([
      {
        href: 'mailto:ids-bioinformatics@rivm.nl',
        label: 'ids-bioinformatics@rivm.nl',
      },
      {
        href: 'https://github.com/RIVM-bioinformatics/gen-epix',
        label: 'Information for the press',
      },
    ]);
    expect(footer.sections[1].items).toEqual([
      {
        href: 'https://github.com/RIVM-bioinformatics/gen-epix',
        label: 'Copyright',
      },
      {
        href: 'https://github.com/RIVM-bioinformatics/gen-epix',
        label: 'Accessibility',
      },
    ]);
    const languageItems = footer.sections[2].items;
    expect(languageItems.map(item => item.label)).toEqual(['English', 'Dutch']);
    expect(languageItems.every(item => typeof item.onClick === 'function')).toBe(true);
  });

  it('emits the selected language when a footer language item is clicked', () => {
    const emit = vi.spyOn(container.resolve(I18nService), 'emit').mockImplementation(() => undefined);
    const languageItems = SeqDbStandardConfigUtil.createConfig().createFooter().sections[2].items;

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
    mockLocation(href);

    expect(SeqDbStandardConfigUtil.createConfig().getAPIBaseUrl()).toBe(expectedBaseUrl);
  });

  it.each([
    'https://127.0.0.1:5173',
    'https://localhost:5173',
    'https://example.org',
  ])('returns the local environment label for %s', (href) => {
    mockLocation(href);

    expect(SeqDbStandardConfigUtil.createConfig().getEnvironmentMessage()).toBe('localhost');
  });

  it('throws when the document location is not a valid URL', () => {
    mockLocation('not a URL');
    const config = SeqDbStandardConfigUtil.createConfig();

    expect(() => config.getAPIBaseUrl()).toThrow(TypeError);
    expect(() => config.getEnvironmentMessage()).toThrow(TypeError);
  });
});
