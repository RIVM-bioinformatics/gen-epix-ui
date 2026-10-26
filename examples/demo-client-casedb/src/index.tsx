import { createRoot } from 'react-dom/client';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { I18nService } from '@gen-epix/ui-client-common/classes/services/I18nService';
import { WINDOW_SERVICE_TOKEN } from '@gen-epix/ui-client-common/constants/api.constants';
import { CaseDbApp } from '@gen-epix/ui-client-casedb/components/app/CaseDbApp';
import { setupCaseDb } from '@gen-epix/ui-client-casedb/setup/setup';

import { ConfigUtil } from './utils/ConfigUtil';

const LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE = 'GenEpix-preferred-language';

const init = async () => {
  const config = ConfigUtil.createConfig();
  DependencyContainerUtil.registerConfig(config);
  const container = DependencyContainerUtil.initializeContainer();

  await container.resolve(I18nService).init({
    getCurrentLanguageCode: async () => {
      return Promise.resolve(container.resolve(WINDOW_SERVICE_TOKEN).window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE) ?? window.navigator.language.split('-')[0] ?? 'en');
    },
    languageConfigs: [
      {
        bundles: [
          '/locale/en.json',
        ],
        code: 'en',
      },
      {
        bundles: [
          '/locale/nl.json',
        ],
        code: 'nl',
      },
    ],
    setNewLanguageCode: async (code: string) => {
      return Promise.resolve(container.resolve(WINDOW_SERVICE_TOKEN).window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code));
    },
  });

  setupCaseDb();

  createRoot(document.getElementById('root')).render(
    <CaseDbApp />,
  );
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
