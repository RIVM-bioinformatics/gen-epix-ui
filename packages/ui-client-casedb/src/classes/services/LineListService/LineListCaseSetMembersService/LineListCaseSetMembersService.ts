import type { CaseDbCaseSetMember } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  inject,
  singleton,
} from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { CASEDB_QUERY_KEY } from '../../../../constants/query.constants';
import { LineListServiceAbstract } from '../LineListServiceAbstract';


@singleton()
export class LineListCaseSetMembersService extends LineListServiceAbstract {

  protected readonly queryKey: CASEDB_QUERY_KEY = CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET;
  private readonly caseDbCaseApi: CaseDbCaseApi;

  public constructor(
    @inject(QueryClientService) queryClientService: QueryClientService,
    @inject(CaseDbCaseApi) caseDbCaseApi: CaseDbCaseApi,
  ) {
    super(queryClientService);
    this.caseDbCaseApi = caseDbCaseApi;
  }

  protected async fetchMatchingCaseIds(caseIds: string[]): Promise<string[]> {
    const caseSetMembersResult = (await this.caseDbCaseApi.caseSetMembersPostQuery({
      invert: false,
      key: 'case_id',
      members: caseIds,
      type: 'UUID_SET',
    }, null, null)).data;

    return caseSetMembersResult.map((caseSetMember: CaseDbCaseSetMember) => caseSetMember.case_id);
  }
}
