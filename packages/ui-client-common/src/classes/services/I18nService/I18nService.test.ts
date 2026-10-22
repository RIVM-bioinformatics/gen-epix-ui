import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { initReactI18next } from 'react-i18next';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { I18nService } from './I18nService';
import type { LanguageConfig } from './I18nService';

const mocks = vi.hoisted(() => {
  const addResourceBundle = vi.fn();
  const changeLanguage = vi.fn(async (_code: string) => Promise.resolve());
  const fetch = vi.fn();
  const init = vi.fn(async (_options: unknown) => Promise.resolve());
  const use = vi.fn((_plugin: unknown) => ({ init }));

  return {
    addResourceBundle,
    changeLanguage,
    fetch,
    init,
    use,
  };
});

vi.mock('i18next', () => ({
  changeLanguage: mocks.changeLanguage,
  default: {
    addResourceBundle: mocks.addResourceBundle,
  },
  use: mocks.use,
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { name: 'initReactI18next' },
}));

type CapturedInitOptions = {
  fallbackLng: string;
  interpolation: {
    escapeValue: boolean;
  };
  lng: string;
  missingInterpolationHandler: (text: string, value: unknown, options: unknown) => void;
  missingKeyHandler: (languages: string[], namespace: string, key: string) => void;
};

const createLanguageConfig = (code: string, bundles: string[] = []): LanguageConfig => ({
  bundles,
  code,
});

const createInitArgs = (
  languageConfigs: LanguageConfig[],
  getCurrentLanguageCode: () => Promise<string> | string,
) => ({
  getCurrentLanguageCode,
  languageConfigs,
  setNewLanguageCode: vi.fn(async (_code: string) => Promise.resolve()),
});

const createFetchResponse = (translation: Record<string, string>, ok = true) => ({
  json: async () => Promise.resolve({ translation }),
  ok,
});

const originalDocumentLanguage = document.documentElement.getAttribute('lang');
let capturedInitOptions: unknown;

describe('I18nService', () => {
  beforeEach(() => {
    capturedInitOptions = undefined;
    mocks.addResourceBundle.mockReset();
    mocks.changeLanguage.mockReset().mockImplementation(async () => Promise.resolve());
    mocks.fetch.mockReset();
    mocks.init.mockReset().mockImplementation(async (options: unknown) => {
      capturedInitOptions = options;
      return Promise.resolve();
    });
    mocks.use.mockReset().mockImplementation(() => ({ init: mocks.init }));
    vi.stubGlobal('fetch', mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    if (originalDocumentLanguage === null) {
      document.documentElement.removeAttribute('lang');
    } else {
      document.documentElement.setAttribute('lang', originalDocumentLanguage);
    }
  });

  it('initializes the current language, loads every bundle, and configures missing-key handlers', async () => {
    const service = new I18nService(WindowService.getInstance());
    const languageConfigs = [
      createLanguageConfig('en'),
      createLanguageConfig('nl', ['/nl/common.json', '/nl/admin.json']),
    ];
    const getCurrentLanguageCode = vi.fn(async () => Promise.resolve('nl'));
    const initArgs = createInitArgs(languageConfigs, getCurrentLanguageCode);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.fetch
      .mockImplementationOnce(async () => Promise.resolve(createFetchResponse({ greeting: 'Hallo' })))
      .mockImplementationOnce(async () => Promise.resolve(createFetchResponse({ save: 'Opslaan' })));

    await service.init(initArgs);

    expect(getCurrentLanguageCode).toHaveBeenCalledOnce();
    expect(mocks.use).toHaveBeenCalledWith(initReactI18next);
    expect(mocks.init).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      fallbackLng: 'nl',
      interpolation: { escapeValue: false },
      lng: 'nl',
    }));
    expect(mocks.fetch).toHaveBeenNthCalledWith(1, '/nl/common.json');
    expect(mocks.fetch).toHaveBeenNthCalledWith(2, '/nl/admin.json');
    expect(mocks.addResourceBundle).toHaveBeenNthCalledWith(1, 'nl', 'translation', { greeting: 'Hallo' }, true, false);
    expect(mocks.addResourceBundle).toHaveBeenNthCalledWith(2, 'nl', 'translation', { save: 'Opslaan' }, true, false);
    expect(document.documentElement.getAttribute('lang')).toBe('nl');

    if (typeof capturedInitOptions !== 'object' || capturedInitOptions === null) {
      throw new Error('Expected i18next initialization options');
    }
    const handlers = capturedInitOptions as CapturedInitOptions;
    handlers.missingInterpolationHandler('greeting', { name: 'Ada' }, { lng: 'nl' });
    handlers.missingKeyHandler(['nl'], 'translation', 'missing.key');

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Missing interpolation for key: "greeting"'),
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      2,
      'Missing translation for key: "missing.key" in language: "nl" and namespace: "translation"',
    );
  });

  it('initializes synchronously with an empty bundle list without fetching', async () => {
    const service = new I18nService(WindowService.getInstance());
    const getCurrentLanguageCode = vi.fn(() => 'en');

    await service.init(createInitArgs([createLanguageConfig('en')], getCurrentLanguageCode));

    expect(getCurrentLanguageCode).toHaveBeenCalledOnce();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('throws an explicit error when the current language is not configured', async () => {
    const service = new I18nService(WindowService.getInstance());

    await expect(service.init(createInitArgs(
      [createLanguageConfig('nl')],
      () => 'fr',
    ))).rejects.toThrowError(new Error('No i18n config found for code: fr'));

    expect(mocks.use).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('warns and returns when initialized a second time', async () => {
    const service = new I18nService(WindowService.getInstance());
    await service.init(createInitArgs([createLanguageConfig('nl')], () => 'nl'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const secondGetCurrentLanguageCode = vi.fn(() => 'en');

    await service.init(createInitArgs([createLanguageConfig('en')], secondGetCurrentLanguageCode));

    expect(warnSpy).toHaveBeenCalledExactlyOnceWith('I18nService is already initialized');
    expect(secondGetCurrentLanguageCode).not.toHaveBeenCalled();
    expect(mocks.use).toHaveBeenCalledOnce();
    expect(mocks.init).toHaveBeenCalledOnce();
  });

  it('propagates failed bundle responses and allows initialization to be retried', async () => {
    const service = new I18nService(WindowService.getInstance());
    const initArgs = createInitArgs([createLanguageConfig('nl', ['/nl.json'])], () => 'nl');
    mocks.fetch
      .mockImplementationOnce(async () => Promise.resolve(createFetchResponse({}, false)))
      .mockImplementationOnce(async () => Promise.resolve(createFetchResponse({ greeting: 'Hallo' })));

    await expect(service.init(initArgs)).rejects.toThrowError(
      new Error('Failed to load i18n bundle: /nl.json'),
    );
    expect(document.documentElement.getAttribute('lang')).not.toBe('nl');

    await service.init(initArgs);

    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.use).toHaveBeenCalledTimes(2);
    expect(document.documentElement.getAttribute('lang')).toBe('nl');
  });

  it('propagates network errors while loading bundles', async () => {
    const service = new I18nService(WindowService.getInstance());
    mocks.fetch.mockImplementationOnce(async () => Promise.reject(new Error('Network unavailable')));

    await expect(service.init(createInitArgs(
      [createLanguageConfig('nl', ['/nl.json'])],
      () => 'nl',
    ))).rejects.toThrowError(new Error('Network unavailable'));
  });

  it('updates the saved language and document attribute without changing the active i18next language', async () => {
    const service = new I18nService(WindowService.getInstance());
    const setNewLanguageCode = vi.fn(async (_code: string) => Promise.resolve());
    const initArgs = createInitArgs([createLanguageConfig('nl')], () => 'nl');
    initArgs.setNewLanguageCode = setNewLanguageCode;
    await service.init(initArgs);

    await service.switchLanguageConfig('nl');

    expect(setNewLanguageCode).toHaveBeenCalledExactlyOnceWith('nl');
    expect(document.documentElement.getAttribute('lang')).toBe('nl');
    expect(mocks.changeLanguage).not.toHaveBeenCalled();
  });

  it('warns when the document is unavailable while persisting a language setting', async () => {
    const windowService = WindowService.getInstance();
    const service = new I18nService(windowService);
    const setNewLanguageCode = vi.fn(async (_code: string) => Promise.resolve());
    const initArgs = createInitArgs([createLanguageConfig('nl')], () => 'nl');
    initArgs.setNewLanguageCode = setNewLanguageCode;
    await service.init(initArgs);
    vi.spyOn(windowService, 'document', 'get').mockReturnValue(null);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.switchLanguageConfig('nl');

    expect(setNewLanguageCode).toHaveBeenCalledWith('nl');
    expect(warnSpy).toHaveBeenCalledWith('Document is not available, cannot set lang attribute');
  });

  it('loads a new language before saving it and skips bundles already loaded', async () => {
    const service = new I18nService(WindowService.getInstance());
    const initArgs = createInitArgs([
      createLanguageConfig('en'),
      createLanguageConfig('nl', ['/nl.json']),
    ], () => 'en');
    mocks.fetch.mockImplementationOnce(async () => Promise.resolve(createFetchResponse({ greeting: 'Hallo' })));

    await service.init(initArgs);
    await service.switchLanguage('nl');

    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(initArgs.setNewLanguageCode).toHaveBeenCalledWith('nl');
    expect(mocks.changeLanguage).toHaveBeenCalledWith('nl');
    expect(document.documentElement.getAttribute('lang')).toBe('nl');

    await service.switchLanguage('en');

    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(initArgs.setNewLanguageCode).toHaveBeenNthCalledWith(2, 'en');
    expect(mocks.changeLanguage).toHaveBeenNthCalledWith(2, 'en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('does not save an unsupported language before reporting its missing configuration', async () => {
    const service = new I18nService(WindowService.getInstance());
    const initArgs = createInitArgs([createLanguageConfig('en')], () => 'en');
    await service.init(initArgs);

    await expect(service.switchLanguage('fr')).rejects.toThrowError(
      new Error('No i18n config found for code: fr'),
    );

    expect(initArgs.setNewLanguageCode).not.toHaveBeenCalled();
    expect(mocks.changeLanguage).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('does not save a language when its bundle cannot be loaded', async () => {
    const service = new I18nService(WindowService.getInstance());
    const initArgs = createInitArgs([
      createLanguageConfig('en'),
      createLanguageConfig('nl', ['/nl.json']),
    ], () => 'en');
    await service.init(initArgs);
    mocks.fetch.mockImplementationOnce(async () => Promise.resolve(createFetchResponse({}, false)));

    await expect(service.switchLanguage('nl')).rejects.toThrowError(
      new Error('Failed to load i18n bundle: /nl.json'),
    );

    expect(initArgs.setNewLanguageCode).not.toHaveBeenCalled();
    expect(mocks.changeLanguage).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});
