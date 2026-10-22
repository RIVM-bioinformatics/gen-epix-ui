import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { CASEDB_QUERY_KEY } from '../../../../constants/query.constants';

import { LineListIsOwnCaseService } from './LineListIsOwnCaseService';

const createService = () => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const retrieveIsOwnCases = vi.fn();
  const service = new LineListIsOwnCaseService(
    queryClientService,
    { retrieveIsOwnCases } as unknown as CaseDbCaseApi,
  );

  return {
    queryClientService,
    retrieveIsOwnCases,
    service,
  };
};

describe('LineListIsOwnCaseService', () => {
  it('loads ownership results into the boolean cache', async () => {
    const { queryClientService, retrieveIsOwnCases, service } = createService();
    retrieveIsOwnCases.mockResolvedValue({
      data: {
        'case-1': true,
        'case-2': false,
      },
    });

    await service.loadRange(['case-1', 'case-2'], 'case-type-1');

    expect(retrieveIsOwnCases).toHaveBeenCalledWith({
      case_ids: ['case-1', 'case-2'],
      case_type_id: 'case-type-1',
    });
    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.XXX_CASE_ID_IS_OWN_CASE))).toEqual({
      'case-1': true,
      'case-2': false,
    });
  });

  it('rejects queued queries when the case type is missing', async () => {
    const { retrieveIsOwnCases, service } = createService();
    const pendingQuery = service.query('case-1');

    await service.loadRange(['case-1']);

    await expect(pendingQuery).rejects.toThrow('caseTypeId is required for LineListIsOwnCaseService');
    expect(retrieveIsOwnCases).not.toHaveBeenCalled();
  });
});
