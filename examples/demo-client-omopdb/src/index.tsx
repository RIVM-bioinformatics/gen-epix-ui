import { createRoot } from 'react-dom/client';
import {
  ConfigManager,
  I18nManager,
  WindowManager,
} from '@gen-epix/ui';
import {
  OmopDbApp,
  setupOmopDb,
} from '@gen-epix/ui-omopdb';
import type { OmopDbConfig } from '@gen-epix/ui-omopdb';

import { ConfigUtil } from './utils/ConfigUtil';

const LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE = 'GenEpix-preferred-language';

const init = async () => {
  await I18nManager.getInstance().init({
    getCurrentLanguageCode: async () => {
      return Promise.resolve(WindowManager.getInstance().window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE) ?? window.navigator.language.split('-')[0] ?? 'en');
    },
    languageConfigs: [
      {
        bundles: [
          '/locale/en.json',
          '/locale/ui/en.json',
          '/locale/ui-omopdb/en.json',
        ],
        code: 'en',
      },
      {
        bundles: [
          '/locale/nl.json',
          '/locale/ui/nl.json',
          '/locale/ui-omopdb/nl.json',
        ],
        code: 'nl',
      },
    ],
    setNewLanguageCode: async (code: string) => {
      return Promise.resolve(WindowManager.getInstance().window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code));
    },
  });

  ConfigManager.getInstance<OmopDbConfig>().config = ConfigUtil.createConfig();
  setupOmopDb();

  createRoot(document.getElementById('root')).render(
    <OmopDbApp />,
  );
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
