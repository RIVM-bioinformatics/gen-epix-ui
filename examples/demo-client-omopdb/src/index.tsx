import { createRoot } from 'react-dom/client';
import { ConfigService } from '@gen-epix/ui-client-common/classes/services/ConfigService';
import { I18nService } from '@gen-epix/ui-client-common/classes/services/I18nService';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import type { OmopDbConfig } from '@gen-epix/ui-client-omopdb/models/config';
import { OmopDbApp } from '@gen-epix/ui-client-omopdb/components/app/OmopDbApp';
import { setupOmopDb } from '@gen-epix/ui-client-omopdb/setup/setup';

import { ConfigUtil } from './utils/ConfigUtil/ConfigUtil';

const LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE = 'GenEpix-preferred-language';

const init = async () => {
  await I18nService.getInstance().init({
    getCurrentLanguageCode: async () => {
      return Promise.resolve(WindowService.getInstance().window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE) ?? window.navigator.language.split('-')[0] ?? 'en');
    },
    languageConfigs: [
      {
        bundles: [
          '/locale/en.json',
          '/locale/ui/en.json',
          '/locale/ui-core-form/en.json',
          '/locale/ui-client-omopdb/en.json',
        ],
        code: 'en',
      },
      {
        bundles: [
          '/locale/nl.json',
          '/locale/ui/nl.json',
          '/locale/ui-core-form/nl.json',
          '/locale/ui-client-omopdb/nl.json',
        ],
        code: 'nl',
      },
    ],
    setNewLanguageCode: async (code: string) => {
      return Promise.resolve(WindowService.getInstance().window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code));
    },
  });

  ConfigService.getInstance<OmopDbConfig>().config = ConfigUtil.createConfig();
  setupOmopDb();

  createRoot(document.getElementById('root')).render(
    <OmopDbApp />,
  );
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
