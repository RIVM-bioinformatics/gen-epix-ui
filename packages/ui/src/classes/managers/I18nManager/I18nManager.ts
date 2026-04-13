import i18next, {
  changeLanguage,
  use,
} from 'i18next';
import { initReactI18next } from 'react-i18next';

import { WindowManager } from '../WindowManager';
import { ConfigManager } from '../ConfigManager';
import { EventBusAbstract } from '../../abstracts/EventBusAbstract';

type Bundle = {
  translation: Record<string, string>;
};

type I18nEvent = {
  onUserLanguageChange: string;
};

export class I18nManager extends EventBusAbstract<I18nEvent> {
  public static get instance(): I18nManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.i18n = WindowManager.instance.window.managers.i18n || new I18nManager();
    return WindowManager.instance.window.managers.i18n;
  }
  private isInitialized = false;
  private languageLoaded: Record<string, boolean> = {};

  private constructor() {
    super();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('I18nManager is already initialized');
      return;
    }
    const currentLanguageCode = await ConfigManager.instance.config.i18n.getCurrentLanguageCode();
    const defaultLanguageConfig = ConfigManager.instance.config.i18n.languages.find(x => x.code === currentLanguageCode);

    // eslint-disable-next-line @eslint-react/rules-of-hooks
    await use(initReactI18next)
      .init({
        fallbackLng: defaultLanguageConfig.code,
        interpolation: {
          escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
        },
        lng: defaultLanguageConfig.code,
        missingInterpolationHandler: (text, value, options) => {
          console.warn(`Missing interpolation for key: "${text}" with value: "${JSON.stringify(value)}" and options: "${JSON.stringify(options)}"`);
        },
        missingKeyHandler: (lng, ns, key) => {
          console.warn(`Missing translation for key: "${key}" in language: "${lng.join(', ')}" and namespace: "${ns}"`);
        },
      });

    await this.loadResources(defaultLanguageConfig.code);
    this.updateLangAttribute(defaultLanguageConfig.code);
    this.isInitialized = true;
  }

  public async switchLanguage(code: string): Promise<void> {
    await this.switchLanguageConfig(code);

    await this.loadResources(code);
    await changeLanguage(code);
  }

  public async switchLanguageConfig(code: string): Promise<void> {
    await ConfigManager.instance.config.i18n.setNewLanguageCode(code);
    this.updateLangAttribute(code);
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

  private updateLangAttribute(code: string): void {
    const doc = WindowManager.instance.document;
    if (!doc) {
      console.warn('Document is not available, cannot set lang attribute');
      return;
    }
    doc.documentElement.setAttribute('lang', code);
  }
}
