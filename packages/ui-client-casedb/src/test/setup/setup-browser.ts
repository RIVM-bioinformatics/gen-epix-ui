import { setupClientBrowser } from '@gen-epix/ui-client-common/test/lib';

/* eslint-disable import-x/extensions -- TypeScript requires the JSON extension. */
import en from '../../locale/en.json';
import nl from '../../locale/nl.json';
/* eslint-enable import-x/extensions */
import { setupCaseDb } from '../../setup/setup';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';

setupClientBrowser(
  () => ({ ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') }),
  setupCaseDb,
  { en, nl },
);
