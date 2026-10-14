import type { CaseDbCaseSetMember } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  container as rootContainer,
  singleton,
} from 'tsyringe';

import { CASEDB_QUERY_KEY } from '../../../../constants/query.constants';
import { LineListServiceAbstract } from '../LineListServiceAbstract';


@singleton()
export class LineListCaseSetMembersService extends LineListServiceAbstract {

  protected readonly queryKey: CASEDB_QUERY_KEY = CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET;

  public static getInstance(): LineListCaseSetMembersService {
    return rootContainer.resolve(LineListCaseSetMembersService);
  }

  protected async fetchMatchingCaseIds(caseIds: string[]): Promise<string[]> {
    const caseSetMembersResult = (await rootContainer.resolve(CaseDbCaseApi).caseSetMembersPostQuery({
      invert: false,
      key: 'case_id',
      members: caseIds,
      type: 'UUID_SET',
    }, null, null)).data;

    return caseSetMembersResult.map((caseSetMember: CaseDbCaseSetMember) => caseSetMember.case_id);
  }
}
