import { createRoot } from 'react-dom/client';
import {
  ConfigManager,
  I18nManager,
} from '@gen-epix/ui';
import {
  CaseDbApp,
  setupCaseDb,
} from '@gen-epix/ui-casedb';
import type { CaseDbConfig } from '@gen-epix/ui-casedb';

import { ConfigUtil } from './utils/ConfigUtil';

ConfigManager.getInstance<CaseDbConfig>().config = ConfigUtil.createConfig();
I18nManager.getInstance().init()
  .then(() => {
    setupCaseDb();

    createRoot(document.getElementById('root')).render(
      <CaseDbApp />,
    );
  })
  .catch((error) => {
    console.error('Failed to initialize the application', error);
  });
