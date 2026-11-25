import { setupClientBrowser } from '@gen-epix/ui-client-common/test/lib';

/* eslint-disable import-x/extensions -- TypeScript requires the JSON extension. */
import en from '../../locale/en.json';
import nl from '../../locale/nl.json';
/* eslint-enable import-x/extensions */
import { setupOmopDb } from '../../setup/setup';
import { OmopDbStandardConfigUtil } from '../../utils/OmopDbStandardConfigUtil';
import { createOmopDbDemoTheme } from '../../theme/demoTheme';

setupClientBrowser(
  () => ({ ...OmopDbStandardConfigUtil.createConfig(), theme: createOmopDbDemoTheme('light') }),
  setupOmopDb,
  { en, nl },
);
