import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { CASEDB_QUERY_KEY } from '../../../../constants/query.constants';

import { LineListCaseSetMembersService } from './LineListCaseSetMembersService';

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
  const caseSetMembersPostQuery = vi.fn();
  const service = new LineListCaseSetMembersService(
    queryClientService,
    { caseSetMembersPostQuery } as unknown as CaseDbCaseApi,
  );

  return {
    caseSetMembersPostQuery,
    queryClientService,
    service,
  };
};

describe('LineListCaseSetMembersService', () => {
  it('loads case-set membership into the boolean cache', async () => {
    const { caseSetMembersPostQuery, queryClientService, service } = createService();
    const caseOneQuery = service.query('case-1');
    caseSetMembersPostQuery.mockResolvedValue({
      data: [{ case_id: 'case-1' }],
    });

    await service.loadRange(['case-1', 'case-2']);

    expect(await caseOneQuery).toBe(true);
    expect(caseSetMembersPostQuery).toHaveBeenCalledWith({
      invert: false,
      key: 'case_id',
      members: ['case-1', 'case-2'],
      type: 'UUID_SET',
    }, null, null);
    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET))).toEqual({
      'case-1': true,
      'case-2': false,
    });
  });
});
