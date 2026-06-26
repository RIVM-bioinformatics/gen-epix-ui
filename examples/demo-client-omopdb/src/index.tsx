import { createRoot } from 'react-dom/client';
import {
  ConfigManager,
  I18nManager,
} from '@gen-epix/ui';
import {
  OmopDbApp,
  setupOmopDb,
} from '@gen-epix/ui-omopdb';
import type { OmopDbConfig } from '@gen-epix/ui-omopdb';

import { ConfigUtil } from './utils/ConfigUtil';

ConfigManager.getInstance<OmopDbConfig>().config = ConfigUtil.createConfig();
I18nManager.getInstance().init()
  .then(() => {
    setupOmopDb();

    createRoot(document.getElementById('root')).render(
      <OmopDbApp />,
    );
  })
  .catch((error) => {
    console.error('Failed to initialize the application', error);
  });
