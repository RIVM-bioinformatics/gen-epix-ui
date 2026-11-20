import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  beforeAll,
  beforeEach,
} from 'vitest';

/* eslint-disable import-x/extensions -- TypeScript requires the JSON extension. */
import en from '../../locale/en.json';
import nl from '../../locale/nl.json';
/* eslint-enable import-x/extensions */

export type TestLocales = Record<'en' | 'nl', { translation: Record<string, string> }>;

export const addTestTranslations = (...locales: TestLocales[]) => {
  for (const bundle of [{ en, nl }, ...locales]) {
    for (const language of ['en', 'nl'] as const) {
      i18next.addResourceBundle(language, 'translation', bundle[language].translation, true, true);
    }
  }
};

export const setupCoreTestI18n = (...locales: TestLocales[]) => {
  beforeAll(async () => {
    await i18next.use(initReactI18next).init({
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      lng: 'en',
      resources: {},
    });
    addTestTranslations(...locales);
  });
  beforeEach(async () => {
    await i18next.changeLanguage('en');
  });
};
