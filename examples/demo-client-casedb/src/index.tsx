import { createRoot } from 'react-dom/client';
import { ConfigService } from '@gen-epix/ui/classes/services/ConfigService';
import { I18nService } from '@gen-epix/ui/classes/services/I18nService';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import type { CaseDbConfig } from '@gen-epix/ui-casedb/models/config';
import { CaseDbApp } from '@gen-epix/ui-casedb/components/app/CaseDbApp';
import { setupCaseDb } from '@gen-epix/ui-casedb/setup/setup';

import { ConfigUtil } from './utils/ConfigUtil';

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
          '/locale/ui-casedb/en.json',
        ],
        code: 'en',
      },
      {
        bundles: [
          '/locale/nl.json',
          '/locale/ui/nl.json',
          '/locale/ui-casedb/nl.json',
        ],
        code: 'nl',
      },
    ],
    setNewLanguageCode: async (code: string) => {
      return Promise.resolve(WindowService.getInstance().window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code));
    },
  });

  ConfigService.getInstance<CaseDbConfig>().config = ConfigUtil.createConfig();
  setupCaseDb();

  createRoot(document.getElementById('root')).render(
    <CaseDbApp />,
  );
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
