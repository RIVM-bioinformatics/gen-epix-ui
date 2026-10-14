import type {
  CommonDbAbacApi,
  CommonDbAuthApi,
  CommonDbOrganizationApi,
  CommonDbSystemApi,
} from '@gen-epix/api-commondb';
import {
  container as rootContainer,
  singleton,
} from 'tsyringe';

import type { BaseApi } from '../../../models/api';

@singleton()
export class ApiService {
  public abacApi: CommonDbAbacApi;
  public api: BaseApi;
  public authApi: CommonDbAuthApi;
  public organizationApi: CommonDbOrganizationApi;
  public systemApi: CommonDbSystemApi;

  public constructor(kwArgs: {
    abacApi: CommonDbAbacApi;
    authApi: CommonDbAuthApi;
    baseApi: BaseApi;
    organizationApi: CommonDbOrganizationApi;
    systemApi: CommonDbSystemApi;
  }) {
    this.abacApi = kwArgs.abacApi;
    this.api = kwArgs.baseApi;
    this.authApi = kwArgs.authApi;
    this.organizationApi = kwArgs.organizationApi;
    this.systemApi = kwArgs.systemApi;
  }

  public static getInstance(): ApiService {
    return rootContainer.resolve(ApiService);
  }
}
