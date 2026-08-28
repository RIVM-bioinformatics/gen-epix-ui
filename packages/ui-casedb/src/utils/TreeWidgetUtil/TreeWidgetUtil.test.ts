import {
  afterAll,
  beforeAll,
} from 'vitest';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type { CaseDbTreeAlgorithm } from '@gen-epix/api-casedb';

import { DataService } from '../../classes/services/DataService';
import type { TreeConfiguration } from '../../models/dashboard';

import { TreeWidgetUtil } from './TreeWidgetUtil';

describe('TreeWidgetUtil.test', () => {
  describe('getTreeConfigurationId', () => {
    it('concatenates col, refCol, protocol and algorithm IDs separated by underscores', () => {
      const config: Omit<TreeConfiguration, 'computedId'> = {
        col: { id: 'col1' } as TreeConfiguration['col'],
        geneticDistanceProtocol: { id: 'gdp1' } as TreeConfiguration['geneticDistanceProtocol'],
        refCol: { id: 'rc1' } as TreeConfiguration['refCol'],
        treeAlgorithm: { id: 'algo1' } as TreeConfiguration['treeAlgorithm'],
      };
      expect(TreeWidgetUtil.getTreeConfigurationId(config)).toBe('col1_rc1_gdp1_algo1');
    });

    it('handles different ID values correctly', () => {
      const config: Omit<TreeConfiguration, 'computedId'> = {
        col: { id: 'my-col' } as TreeConfiguration['col'],
        geneticDistanceProtocol: { id: 'proto-x' } as TreeConfiguration['geneticDistanceProtocol'],
        refCol: { id: 'my-ref' } as TreeConfiguration['refCol'],
        treeAlgorithm: { id: 'nj-algo' } as TreeConfiguration['treeAlgorithm'],
      };
      expect(TreeWidgetUtil.getTreeConfigurationId(config)).toBe('my-col_my-ref_proto-x_nj-algo');
    });
  });

  describe('getTreeConfigurationLabel', () => {
    it('returns "protocolName - algorithmName"', () => {
      const config: TreeConfiguration = {
        col: { id: 'c1' } as TreeConfiguration['col'],
        computedId: 'test',
        geneticDistanceProtocol: { id: 'g1', name: 'My Protocol' } as TreeConfiguration['geneticDistanceProtocol'],
        refCol: { id: 'r1' } as TreeConfiguration['refCol'],
        treeAlgorithm: { id: 'a1', name: 'NJ Algorithm' } as TreeConfiguration['treeAlgorithm'],
      };
      expect(TreeWidgetUtil.getTreeConfigurationLabel(config)).toBe('My Protocol - NJ Algorithm');
    });

    it('works with different protocol and algorithm names', () => {
      const config: TreeConfiguration = {
        col: { id: 'c1' } as TreeConfiguration['col'],
        computedId: 'x',
        geneticDistanceProtocol: { id: 'g1', name: 'Hamming' } as TreeConfiguration['geneticDistanceProtocol'],
        refCol: { id: 'r1' } as TreeConfiguration['refCol'],
        treeAlgorithm: { id: 'a1', name: 'UPGMA' } as TreeConfiguration['treeAlgorithm'],
      };
      expect(TreeWidgetUtil.getTreeConfigurationLabel(config)).toBe('Hamming - UPGMA');
    });
  });

  describe('getTreeConfigurations', () => {
    let savedTreeAlgorithms: CaseDbTreeAlgorithm[];

    const mockAlgo1: CaseDbTreeAlgorithm = {
      code: 'NJ',
      id: 'algo-nj',
      is_ultrametric: false,
      name: 'Neighbour Joining',
      seqdb_tree_algorithm_id: 'seqdb1',
      tree_algorithm_class_id: 'class1',
    };

    const mockAlgo2: CaseDbTreeAlgorithm = {
      code: 'UPGMA',
      id: 'algo-upgma',
      is_ultrametric: true,
      name: 'UPGMA',
      seqdb_tree_algorithm_id: 'seqdb2',
      tree_algorithm_class_id: 'class1',
    };

    beforeAll(() => {
      savedTreeAlgorithms = DataService.getInstance().data.treeAlgorithms;
      DataService.getInstance().data.treeAlgorithms = [mockAlgo1, mockAlgo2];
    });

    afterAll(() => {
      DataService.getInstance().data.treeAlgorithms = savedTreeAlgorithms;
    });

    it('returns empty array when no GENETIC_DISTANCE cols exist', () => {
      const completeCaseType = {
        cols: {},
        genetic_distance_protocols: {},
        ref_cols: {},
        tree_algorithms: {},
      } as unknown as Parameters<typeof TreeWidgetUtil.getTreeConfigurations>[0];

      expect(TreeWidgetUtil.getTreeConfigurations(completeCaseType)).toEqual([]);
    });

    it('returns one entry per (col × algorithm) pair', () => {
      const completeCaseType = {
        cols: {
          col1: { id: 'col1', ref_col_id: 'rc1', tree_algorithm_codes: ['NJ', 'UPGMA'] },
        },
        genetic_distance_protocols: {
          gdp1: { id: 'gdp1', name: 'Protocol 1' },
        },
        ref_cols: {
          rc1: { col_type: CaseDbColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp1', id: 'rc1' },
        },
        tree_algorithms: {
          NJ: mockAlgo1,
          UPGMA: mockAlgo2,
        },
      } as unknown as Parameters<typeof TreeWidgetUtil.getTreeConfigurations>[0];

      const result = TreeWidgetUtil.getTreeConfigurations(completeCaseType);

      expect(result).toHaveLength(2);
      expect(result[0].col.id).toBe('col1');
      expect(result[0].treeAlgorithm).toBe(mockAlgo1);
      expect(result[1].treeAlgorithm).toBe(mockAlgo2);
    });

    it('sets computedId using getTreeConfigurationId', () => {
      const completeCaseType = {
        cols: {
          col1: { id: 'col1', ref_col_id: 'rc1', tree_algorithm_codes: ['NJ'] },
        },
        genetic_distance_protocols: {
          gdp1: { id: 'gdp1', name: 'Protocol 1' },
        },
        ref_cols: {
          rc1: { col_type: CaseDbColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp1', id: 'rc1' },
        },
        tree_algorithms: {
          NJ: mockAlgo1,
        },
      } as unknown as Parameters<typeof TreeWidgetUtil.getTreeConfigurations>[0];

      const result = TreeWidgetUtil.getTreeConfigurations(completeCaseType);

      expect(result[0].computedId).toBe('col1_rc1_gdp1_algo-nj');
    });

    it('sorts algorithms according to DataService.getInstance().data.treeAlgorithms order', () => {
      // DataService order: [mockAlgo1(NJ), mockAlgo2(UPGMA)]
      // col specifies UPGMA first, then NJ -> result should be sorted to NJ then UPGMA
      const completeCaseType = {
        cols: {
          col1: { id: 'col1', ref_col_id: 'rc1', tree_algorithm_codes: ['UPGMA', 'NJ'] },
        },
        genetic_distance_protocols: {
          gdp1: { id: 'gdp1', name: 'Protocol 1' },
        },
        ref_cols: {
          rc1: { col_type: CaseDbColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp1', id: 'rc1' },
        },
        tree_algorithms: {
          NJ: mockAlgo1,
          UPGMA: mockAlgo2,
        },
      } as unknown as Parameters<typeof TreeWidgetUtil.getTreeConfigurations>[0];

      const result = TreeWidgetUtil.getTreeConfigurations(completeCaseType);

      expect(result[0].treeAlgorithm.code).toBe('NJ');
      expect(result[1].treeAlgorithm.code).toBe('UPGMA');
    });
  });
});
