import {
  describe,
  it,
  expect,
} from 'vitest';


import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { QUERY_KEY } from '../../models/query';

import { QueryUtil } from './QueryUtil';

describe('QueryUtil', () => {
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
