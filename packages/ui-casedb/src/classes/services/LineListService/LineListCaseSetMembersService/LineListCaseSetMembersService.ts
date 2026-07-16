import type { CaseDbCaseSetMember } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { HmrUtil } from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../../../data/query';
import { LineListServiceAbstract } from '../LineListServiceAbstract';


export class LineListCaseSetMembersService extends LineListServiceAbstract {
  private static __instance: LineListCaseSetMembersService;

  protected readonly queryKey: CASEDB_QUERY_KEY = CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET;

  private constructor() {
    super();
  }

  public static getInstance(): LineListCaseSetMembersService {
    LineListCaseSetMembersService.__instance = HmrUtil.getHmrSingleton('lineListCaseSetMembersService', LineListCaseSetMembersService.__instance, () => new LineListCaseSetMembersService());
    return LineListCaseSetMembersService.__instance;
  }

  protected async fetchMatchingCaseIds(caseIds: string[]): Promise<string[]> {
    const caseSetMembersResult = (await CaseDbCaseApi.getInstance().caseSetMembersPostQuery({
      invert: false,
      key: 'case_id',
      members: caseIds,
      type: 'UUID_SET',
    }, null, null)).data;

    return caseSetMembersResult.map((caseSetMember: CaseDbCaseSetMember) => caseSetMember.case_id);
  }
}
