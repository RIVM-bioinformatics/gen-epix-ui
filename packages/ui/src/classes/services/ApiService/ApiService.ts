import type {
  CommonDbAbacApi,
  CommonDbAuthApi,
  CommonDbOrganizationApi,
  CommonDbSystemApi,
} from '@gen-epix/api-commondb';

import { HmrUtil } from '../../../utils/HmrUtil';
import type { BaseApi } from '../../../models/api';

export class ApiService {
  private static __instance: ApiService;
  public abacApi: CommonDbAbacApi;
  public api: BaseApi;
  public authApi: CommonDbAuthApi;
  public organizationApi: CommonDbOrganizationApi;
  public systemApi: CommonDbSystemApi;

  private constructor() {
    //
  }

  public static getInstance(): ApiService {
    ApiService.__instance = HmrUtil.getHmrSingleton('apiService', ApiService.__instance, () => new ApiService());
    return ApiService.__instance;
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
