import {
  describe,
  it,
  expect,
} from 'vitest';
import Decimal from 'decimal.js';

import type { TreeNode } from '../../models/tree';

import { EpiNewickUtil } from './EpiNewickUtil';

describe('NewickUtil', () => {
  describe('parseNewick', () => {
    it('should parse a simple Newick string', () => {
      const newick = '(A,B,(C,D));';
      const expectedTree: Partial<TreeNode> = {
        children: [
          {
            name: 'A',
            size: 1,
            maxBranchLength: new Decimal(0),
            subTreeLeaveNames: [
              'A',
            ],
          },
          {
            name: 'B',
            size: 1,
            maxBranchLength: new Decimal(0),
            subTreeLeaveNames: [
              'B',
            ],
          },
          {
            children: [
              {
                name: 'C',
                size: 1,
                maxBranchLength: new Decimal(0),
                subTreeLeaveNames: [
                  'C',
                ],
              },
              {
                name: 'D',
                size: 1,
                maxBranchLength: new Decimal(0),
                subTreeLeaveNames: [
                  'D',
                ],
              },
            ],
            size: 2,
            subTreeNames: [],
            subTreeLeaveNames: [
              'C',
              'D',
            ],
          },
        ],
        size: 4,
        subTreeNames: [],
        subTreeLeaveNames: [
          'A',
          'B',
          'C',
          'D',
        ],
        name: 'Root',
        branchLength: new Decimal(0),
        maxBranchLength: new Decimal(0),
      };

      const tree = EpiNewickUtil.parse(newick);
      expect(tree).toEqual(expectedTree);
    });

    it('should handle branch lengths', () => {
      const newick = '(A:0.1,B:0.2,(C:0.3,D:0.4):0.5);';
      const expectedTree: Partial<TreeNode> = {
        children: [
          {
            name: 'A',
            branchLength: new Decimal('0.1'),
            subTreeNames: [],
            subTreeLeaveNames: [
              'A',
            ],
            maxBranchLength: new Decimal('0.1'),
            size: 1,
          },
          {
            name: 'B',
            branchLength: new Decimal('0.2'),
            subTreeNames: [],
            subTreeLeaveNames: [
              'B',
            ],
            maxBranchLength: new Decimal('0.2'),
            size: 1,
          },
          {
            children: [
              {
                name: 'C',
                branchLength: new Decimal('0.3'),
                subTreeNames: [],
                subTreeLeaveNames: [
                  'C',
                ],
                maxBranchLength: new Decimal('0.3'),
                size: 1,
              },
              {
                name: 'D',
                branchLength: new Decimal('0.4'),
                subTreeNames: [],
                subTreeLeaveNames: [
                  'D',
                ],
                maxBranchLength: new Decimal('0.4'),
                size: 1,
              },
            ],
            size: 2,
            subTreeNames: [
              'C',
              'D',
            ],
            subTreeLeaveNames: [
              'C',
              'D',
            ],
            branchLength: new Decimal('0.5'),
            maxBranchLength: new Decimal('0.9'),
            name: 'Generated-7225787341756924',
          },
        ],
        size: 4,
        subTreeNames: [
          'C',
          'D',
        ],
        subTreeLeaveNames: [
          'A',
          'B',
          'C',
          'D',
        ],
        name: 'Root',
        branchLength: new Decimal('0'),
        maxBranchLength: new Decimal('0.9'),
      };
      const tree = EpiNewickUtil.parse(newick);
      expect(tree).toEqual(expectedTree);
    });
  });
});
