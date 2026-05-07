import { createRoot } from 'react-dom/client';
import {
  App,
  ConfigManager,
  I18nManager,
  setup,
} from '@gen-epix/ui';
import type { CaseDbConfig } from '@gen-epix/ui-casedb';

import { ConfigUtil } from './utils/ConfigUtil';

ConfigManager.getInstance<CaseDbConfig>().config = ConfigUtil.createConfig();
I18nManager.getInstance().init()
  .then(() => {
    setup();

    createRoot(document.getElementById('root')).render(
      <App />,
    );
  })
  .catch(() => {
    alert('Failed to initialize the application');
  });
