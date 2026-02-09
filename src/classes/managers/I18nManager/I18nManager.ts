import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { WindowManager } from '../WindowManager';
import { ConfigManager } from '../ConfigManager';

type Bundle = {
  translation: Record<string, string>;
};

export class I18nManager {
  private isInitialized = false;
  private languageLoaded: Record<string, boolean> = {};
  private constructor() {
    //
  }

  public static get instance(): I18nManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.i18n = WindowManager.instance.window.managers.i18n || new I18nManager();
    return WindowManager.instance.window.managers.i18n;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('I18nManager is already initialized');
      return;
    }
    const currentLanguageCode = await ConfigManager.instance.config.i18n.getCurrentLanguageCode();
    const defaultLanguageConfig = ConfigManager.instance.config.i18n.languages.find(x => x.code === currentLanguageCode);

    await i18next
      .use(initReactI18next)
      .init({
        lng: defaultLanguageConfig.code,
        fallbackLng: defaultLanguageConfig.code,
        missingKeyHandler: (lng, ns, key) => {
          console.warn(`Missing translation for key: "${key}" in language: "${lng.join(', ')}" and namespace: "${ns}"`);
        },
        missingInterpolationHandler: (text, value, options) => {
          console.warn(`Missing interpolation for key: "${text}" with value: "${JSON.stringify(value)}" and options: "${JSON.stringify(options)}"`);
        },
        interpolation: {
          escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
        },
      });

    await this.loadResources(defaultLanguageConfig.code);
    this.isInitialized = true;
  }

  public async switchLanguage(code: string): Promise<void> {
    await ConfigManager.instance.config.i18n.setNewLanguageCode(code);
    await this.loadResources(code);
    await i18next.changeLanguage(code);
  }

  private async loadResources(code: string): Promise<void> {
    if (this.languageLoaded[code]) {
      return;
    }
    const config = ConfigManager.instance.config.i18n.languages.find(x => x.code === code);
    if (!config) {
      throw new Error(`No i18n config found for code: ${code}`);
    }
    await Promise.all(config.bundles.map(async (bundleUrl) => {
      const response = await fetch(bundleUrl);
      if (!response.ok) {
        throw new Error(`Failed to load i18n bundle: ${bundleUrl}`);
      }
      const json = await response.json() as Bundle;
      i18next.addResourceBundle(
        config.code,
        'translation',
        json.translation,
        true,
        false,
      );
    }));
    this.languageLoaded[code] = true;
  }
}
