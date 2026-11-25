import { setupCoreTestI18n } from '@gen-epix/ui-core-components/test/lib';
import { beforeEach } from 'vitest';

import { setupUiCoreForm } from '../../setup/setup';
import { formTestLocales } from '../lib/locales';

setupCoreTestI18n(formTestLocales);
beforeEach(setupUiCoreForm);
