import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { HmrUtil } from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../../../data/query';
import { LineListServiceAbstract } from '../LineListServiceAbstract';


export class LineListIsOwnCaseService extends LineListServiceAbstract {
  private static __instance: LineListIsOwnCaseService;

  protected readonly queryKey: CASEDB_QUERY_KEY = CASEDB_QUERY_KEY.XXX_CASE_ID_IS_OWN_CASE;

  private constructor() {
    super();
  }

  public static getInstance(): LineListIsOwnCaseService {
    LineListIsOwnCaseService.__instance = HmrUtil.getHmrSingleton('lineListIsOwnCaseService', LineListIsOwnCaseService.__instance, () => new LineListIsOwnCaseService());
    return LineListIsOwnCaseService.__instance;
  }

  protected async fetchMatchingCaseIds(caseIds: string[], caseTypeId: string): Promise<string[]> {
    if (!caseTypeId) {
      throw new Error('caseTypeId is required for LineListIsOwnCaseService');
    }
    const retrieveIsOwnCasesResult = (await CaseDbCaseApi.getInstance().retrieveIsOwnCases({
      case_ids: caseIds,
      case_type_id: caseTypeId,
    })).data;

    return Object.entries(retrieveIsOwnCasesResult).reduce((prev, curr) => {
      const [caseId, isOwnCase] = curr;
      if (isOwnCase) {
        prev.push(caseId);
      }
      return prev;
    }, [] as string[]);
  }
}
