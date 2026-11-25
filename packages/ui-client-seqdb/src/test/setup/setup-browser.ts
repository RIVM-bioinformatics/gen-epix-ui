import { setupClientBrowser } from '@gen-epix/ui-client-common/test/lib';

/* eslint-disable import-x/extensions -- TypeScript requires the JSON extension. */
import en from '../../locale/en.json';
import nl from '../../locale/nl.json';
/* eslint-enable import-x/extensions */
import { setupSeqDb } from '../../setup/setup';
import { SeqDbStandardConfigUtil } from '../../utils/SeqDbStandardConfigUtil';
import { createSeqDbDemoTheme } from '../../theme/demoTheme';

setupClientBrowser(
  () => ({ ...SeqDbStandardConfigUtil.createConfig(), theme: createSeqDbDemoTheme('light') }),
  setupSeqDb,
  { en, nl },
);
