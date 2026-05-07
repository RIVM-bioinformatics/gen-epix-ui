import type {
  CommonDbAbacApi,
  CommonDbAuthApi,
  CommonDbOrganizationApi,
  CommonDbSystemApi,
} from '@gen-epix/api-commondb';

import { HmrUtil } from '../../../utils/HmrUtil';
import type { BaseApi } from '../../../models/api';

export class ApiManager {
  private static __instance: ApiManager;
  public abacApi: CommonDbAbacApi;
  public api: BaseApi;
  public authApi: CommonDbAuthApi;
  public organizationApi: CommonDbOrganizationApi;
  public systemApi: CommonDbSystemApi;

  private constructor() {
    //
  }

  public static getInstance(): ApiManager {
    ApiManager.__instance = HmrUtil.getHmrSingleton('apiManager', ApiManager.__instance, () => new ApiManager());
    return ApiManager.__instance;
  }

  public initialize(kwArgs: {
    abacApi: CommonDbAbacApi;
    authApi: CommonDbAuthApi;
    baseApi: BaseApi;
    organizationApi: CommonDbOrganizationApi;
    systemApi: CommonDbSystemApi;
  }): void {
    this.abacApi = kwArgs.abacApi;
    this.api = kwArgs.baseApi;
    this.authApi = kwArgs.authApi;
    this.organizationApi = kwArgs.organizationApi;
    this.systemApi = kwArgs.systemApi;
  }
}
