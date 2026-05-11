import { createRoot } from 'react-dom/client';
import {
  App,
  ConfigManager,
  I18nManager,
} from '@gen-epix/ui';
import {
  type CaseDbConfig,
  setupCaseDb,
} from '@gen-epix/ui-casedb';

import { ConfigUtil } from './utils/ConfigUtil';

ConfigManager.getInstance<CaseDbConfig>().config = ConfigUtil.createConfig();
I18nManager.getInstance().init()
  .then(() => {
    setupCaseDb();

    createRoot(document.getElementById('root')).render(
      <App />,
    );
  })
  .catch((error) => {
    console.error('Failed to initialize the application', error);
  });
