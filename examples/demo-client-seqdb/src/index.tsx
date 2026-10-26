import { createRoot } from 'react-dom/client';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { I18nService } from '@gen-epix/ui-client-common/classes/services/I18nService';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import { SeqDbApp } from '@gen-epix/ui-client-seqdb/components/app/SeqDbApp';
import { setupSeqDb } from '@gen-epix/ui-client-seqdb/setup/setup';

import { ConfigUtil } from './utils/ConfigUtil';

const LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE = 'GenEpix-preferred-language';

const init = async () => {
  const config = ConfigUtil.createConfig();
  DependencyContainerUtil.registerConfig(config);
  const container = DependencyContainerUtil.initializeContainer();

  await container.resolve(I18nService).init({
    getCurrentLanguageCode: async () => {
      return Promise.resolve(WindowService.getInstance().window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE) ?? window.navigator.language.split('-')[0] ?? 'en');
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
      return Promise.resolve(WindowService.getInstance().window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code));
    },
  });

  setupSeqDb();

  createRoot(document.getElementById('root')).render(
    <SeqDbApp />,
  );
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
