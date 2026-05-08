import { createRoot } from 'react-dom/client';
import {
  App,
  ConfigManager,
  I18nManager,
} from '@gen-epix/ui';
import {
  type SeqDbConfig,
  setupSeqDb,
} from '@gen-epix/ui-seqdb';

import { ConfigUtil } from './utils/ConfigUtil';

ConfigManager.getInstance<SeqDbConfig>().config = ConfigUtil.createConfig();
I18nManager.getInstance().init()
  .then(() => {
    setupSeqDb();

    createRoot(document.getElementById('root')).render(
      <App />,
    );
  })
  .catch((error) => {
    console.error('Failed to initialize the application', error);
  });
