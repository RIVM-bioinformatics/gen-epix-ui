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

import { OmopDbStandardConfigUtil } from './OmopDbStandardConfigUtil';

const createConfig = () => OmopDbStandardConfigUtil.createConfig();

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
        translation: Object.fromEntries([
          ['About', 'About'],
          ['Accessibility', 'Accessibility'],
          ['Contact', 'Contact'],
          ['Copyright', 'Copyright'],
          ['Dutch', 'Dutch'],
          ['English', 'English'],
          ['Information for the press', 'Information for the press'],
          ['Languages', 'Languages'],
        ]),
      },
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OmopDbStandardConfigUtil.createConfig', () => {
  it('inherits the standard config and disables page events', () => {
    const config = createConfig();

    expect(config.applicationName).toBe('Gen-EpiX');
    expect(config.defaultRequestTimeout).toBe(30000);
    expect(config.enablePageEvents).toBe(false);
  });

  it('creates the contact, about, and language footer entries', () => {
    const config = createConfig();
    const sections = config.createFooter().sections;

    expect(sections.map(section => section.header)).toEqual([
      'Contact',
      'About',
      'Languages',
    ]);
    expect(sections[0].items).toEqual([
      {
        href: 'mailto:ids-bioinformatics@rivm.nl',
        label: 'ids-bioinformatics@rivm.nl',
      },
      {
        href: 'https://github.com/RIVM-bioinformatics/gen-epix',
        label: 'Information for the press',
      },
    ]);
    expect(sections[1].items).toEqual([
      {
        href: 'https://github.com/RIVM-bioinformatics/gen-epix',
        label: 'Copyright',
      },
      {
        href: 'https://github.com/RIVM-bioinformatics/gen-epix',
        label: 'Accessibility',
      },
    ]);
    expect(sections[2].items.map(item => item.label)).toEqual(['English', 'Dutch']);
  });

  it('changes the selected language from the footer actions', () => {
    const config = createConfig();
    const emit = vi.spyOn(container.resolve(I18nService), 'emit').mockImplementation(() => undefined);
    const languageItems = config.createFooter().sections[2].items;

    languageItems[0].onClick?.();
    languageItems[1].onClick?.();

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
});
