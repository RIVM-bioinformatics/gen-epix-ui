import { createRoot } from 'react-dom/client';
import {
  App,
  ConfigManager,
  I18nManager,
} from '@gen-epix/ui';
import {
  type OmopDbConfig,
  setupOmopDb,
} from '@gen-epix/ui-omopdb';

import { ConfigUtil } from './utils/ConfigUtil';

ConfigManager.getInstance<OmopDbConfig>().config = ConfigUtil.createConfig();
I18nManager.getInstance().init()
  .then(() => {
    setupOmopDb();

    createRoot(document.getElementById('root')).render(
      <App />,
    );
  })
  .catch((error) => {
    console.error('Failed to initialize the application', error);
  });
