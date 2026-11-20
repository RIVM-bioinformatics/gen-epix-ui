import 'reflect-metadata';
import {
  CaseDbAbacApi,
  CaseDbAuthApi,
  CaseDbBaseAPI,
  CaseDbOrganizationApi,
  CaseDbSystemApi,
} from '@gen-epix/api-casedb';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';

import {
  API_ABAC_TOKEN,
  API_AUTH_TOKEN,
  API_BASE_TOKEN,
  API_ORGANIZATION_TOKEN,
  API_SYSTEM_TOKEN,
} from '../../constants/api.constants';
import { setupClientCommon } from '../../setup/setup';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';
import { setupClientBrowser } from '../lib/setupClientBrowser';

setupClientBrowser(
  () => ({ ...StandardConfigUtil.createConfig(), theme: createDemoTheme('light') }),
  () => {
    setupClientCommon();
    // CommonDB supplies contracts; use a real SDK implementation at the HTTP boundary.
    container.registerInstance(API_BASE_TOKEN, CaseDbBaseAPI);
    container.registerInstance(API_ABAC_TOKEN, container.resolve(CaseDbAbacApi));
    container.registerInstance(API_AUTH_TOKEN, container.resolve(CaseDbAuthApi));
    container.registerInstance(API_ORGANIZATION_TOKEN, container.resolve(CaseDbOrganizationApi) as CommonDbOrganizationApi);
    container.registerInstance(API_SYSTEM_TOKEN, container.resolve(CaseDbSystemApi));
  },
);
