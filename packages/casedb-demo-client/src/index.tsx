import { createRoot } from 'react-dom/client';
import {
  App,
  ConfigManager,
  I18nManager,
  setup,
} from '@gen-epix/ui';

import { ConfigUtil } from './utils/ConfigUtil';

ConfigManager.instance.config = ConfigUtil.createConfig();
I18nManager.instance.init()
  .then(() => {
    setup();

    createRoot(document.getElementById('root')).render(
      <App />,
    );
  })
  .catch(() => {
    alert('Failed to initialize the application');
  });
