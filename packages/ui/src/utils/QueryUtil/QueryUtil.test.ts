import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ConfigManager } from '../../classes/managers/ConfigManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { Config } from '../../models/config';
import { QUERY_KEY } from '../../models/query';

import { QueryUtil } from './QueryUtil';

describe('QueryUtil', () => {
  beforeAll(() => {
    vi.spyOn(ConfigManager.getInstance, 'config', 'get').mockReturnValue({
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    } as unknown as Config);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('getQueryKeyDependencies', () => {
    it('should return a collection of keys', () => {
      expect(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASES])).toEqual([
        [QUERY_KEY.CASE_TYPE_STATS],
        [QUERY_KEY.CASE_SET_STATS],
        [QUERY_KEY.CASES_LAZY],
        [QUERY_KEY.PHYLOGENETIC_TREE],
        [QUERY_KEY.CASE_IDS_BY_QUERY],
        [QUERY_KEY.CASE_SET_MEMBERS],
        [QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET],
        [QUERY_KEY.CASE_DATA_COLLECTION_LINKS],
        [QUERY_KEY.CASE_RIGHTS],
      ]);
    });
  });

  describe('try invalidating query behavior', () => {
    it('should invalidate queries', () => {
      const queryClient = QueryClientManager.instance.queryClient;
      queryClient.setQueryData(['foo'], 'foo');
      queryClient.setQueryData(['foo', 'bar'], 'bar');
      queryClient.removeQueries({
        queryKey: ['foo'],
      });
      expect(queryClient.getQueryData(['foo'])).toBeUndefined();
      expect(queryClient.getQueryData(['foo', 'bar'])).toBeUndefined();
    });
  });
});
