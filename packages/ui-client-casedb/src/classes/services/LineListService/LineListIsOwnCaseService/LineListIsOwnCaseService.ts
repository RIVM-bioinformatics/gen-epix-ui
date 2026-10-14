import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  container as rootContainer,
  singleton,
} from 'tsyringe';

import { CASEDB_QUERY_KEY } from '../../../../constants/query.constants';
import { LineListServiceAbstract } from '../LineListServiceAbstract';


@singleton()
export class LineListIsOwnCaseService extends LineListServiceAbstract {

  protected readonly queryKey: CASEDB_QUERY_KEY = CASEDB_QUERY_KEY.XXX_CASE_ID_IS_OWN_CASE;

  public static getInstance(): LineListIsOwnCaseService {
    return rootContainer.resolve(LineListIsOwnCaseService);
  }

  protected async fetchMatchingCaseIds(caseIds: string[], caseTypeId: string): Promise<string[]> {
    if (!caseTypeId) {
      throw new Error('caseTypeId is required for LineListIsOwnCaseService');
    }
    const retrieveIsOwnCasesResult = (await rootContainer.resolve(CaseDbCaseApi).retrieveIsOwnCases({
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
