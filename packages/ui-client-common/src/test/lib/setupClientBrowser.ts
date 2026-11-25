import 'reflect-metadata';
import { DevicePixelRatioService } from '@gen-epix/ui-core/classes/services/DevicePixelRatioService';
import { KeyboardShortcutService } from '@gen-epix/ui-core/classes/services/KeyboardShortcutService';
import { addTestTranslations } from '@gen-epix/ui-core-components/test/lib';
import type { TestLocales } from '@gen-epix/ui-core-components/test/lib';
import { formTestLocales } from '@gen-epix/ui-core-form/test/lib';
import { container } from 'tsyringe';
import {
  beforeAll,
  beforeEach,
} from 'vitest';
import { cleanup } from 'vitest-browser-react';

import { I18nService } from '../../classes/services/I18nService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { API_BASE_TOKEN } from '../../constants/api.constants';
/* eslint-disable import-x/extensions -- TypeScript requires the JSON extension. */
import en from '../../locale/en.json';
import nl from '../../locale/nl.json';
/* eslint-enable import-x/extensions */
import type { ConfigBase } from '../../models/config.models';
import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';
import {
  startTestApi,
  TEST_API_ORIGIN,
} from '../requests/mockApi';

export const setupClientBrowser = (
  createConfig: () => ConfigBase,
  setupClient: () => void,
  ...locales: TestLocales[]
) => {
  const i18nService = container.resolve(I18nService);
  // These two services attach native listeners for the lifetime of the browser document.
  const pixelRatioService = DevicePixelRatioService.getInstance();
  const keyboardService = KeyboardShortcutService.getInstance();
  beforeAll(async () => {
    await i18nService.init({
      getCurrentLanguageCode: () => 'en',
      languageConfigs: [{ bundles: [], code: 'en' }, { bundles: [], code: 'nl' }],
      setNewLanguageCode: () => undefined,
    });
    addTestTranslations(formTestLocales, { en, nl }, ...locales);
  });
  beforeEach(async () => {
    // Components resolve services from the root container, not a React context.
    container.clearInstances();
    container.registerInstance(DevicePixelRatioService, pixelRatioService);
    container.registerInstance(KeyboardShortcutService, keyboardService);
    container.registerInstance(I18nService, i18nService);
    await i18nService.switchLanguage('en');
    const config = createConfig();
    config.getAPIBaseUrl = () => TEST_API_ORIGIN;
    config.queryClient.retry = () => false;
    DependencyContainerUtil.registerConfig(config);
    setupClient();
    const api = container.resolve(API_BASE_TOKEN);
    api.baseUrl = config.getAPIBaseUrl();
    api.defaultRequestTimeout = config.defaultRequestTimeout;
    api.accessToken = '';
    api.onRequest = [];
    api.onResponseFulfilled = [];
    api.onResponseRejected = [];
    const service = container.resolve(QueryClientService);
    // setupClientCommon registers a factory; the provider and all DI consumers need the same cache.
    container.registerInstance(QueryClientService, service);
    const stopApi = startTestApi();
    return async () => {
      try {
        await cleanup();
      } finally {
        service.queryClient.clear();
        stopApi();
      }
    };
  });
};
