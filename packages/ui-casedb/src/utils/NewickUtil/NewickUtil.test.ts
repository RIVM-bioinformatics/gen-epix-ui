import {
  describe,
  expect,
  it,
} from 'vitest';
import Decimal from 'decimal.js';

import type { TreeNode } from '../../models/tree';

import { NewickUtil } from './NewickUtil';

describe('NewickUtil', () => {
  describe('parseNewick', () => {
    it('should parse a simple Newick string', () => {
      const newick = '(A,B,(C,D));';
      const expectedTree: Partial<TreeNode> = {
        branchLength: new Decimal(0),
        children: [
          {
            maxBranchLength: new Decimal(0),
            name: 'A',
            size: 1,
            subTreeLeaveNames: [
              'A',
            ],
            subTreeNames: [],
          },
          {
            maxBranchLength: new Decimal(0),
            name: 'B',
            size: 1,
            subTreeLeaveNames: [
              'B',
            ],
            subTreeNames: [],
          },
          {
            children: [
              {
                maxBranchLength: new Decimal(0),
                name: 'C',
                size: 1,
                subTreeLeaveNames: [
                  'C',
                ],
                subTreeNames: [],
              },
              {
                maxBranchLength: new Decimal(0),
                name: 'D',
                size: 1,
                subTreeLeaveNames: [
                  'D',
                ],
                subTreeNames: [],
              },
            ],
            maxBranchLength: new Decimal(0),
            size: 2,
            subTreeLeaveNames: [
              'C',
              'D',
            ],
            subTreeNames: [],
          },
        ],
        maxBranchLength: new Decimal(0),
        name: 'Root',
        size: 4,
        subTreeLeaveNames: [
          'A',
          'B',
          'C',
          'D',
        ],
        subTreeNames: [],
      };

      const tree = NewickUtil.parse(newick);
      expect(tree).toEqual(expectedTree);
    });

    it('should handle branch lengths', () => {
      const newick = '(A:0.1,B:0.2,(C:0.3,D:0.4):0.5);';
      const expectedTree: Partial<TreeNode> = {
        branchLength: new Decimal('0'),
        children: [
          {
            branchLength: new Decimal('0.1'),
            maxBranchLength: new Decimal('0.1'),
            name: 'A',
            size: 1,
            subTreeLeaveNames: [
              'A',
            ],
            subTreeNames: [],
          },
          {
            branchLength: new Decimal('0.2'),
            maxBranchLength: new Decimal('0.2'),
            name: 'B',
            size: 1,
            subTreeLeaveNames: [
              'B',
            ],
            subTreeNames: [],
          },
          {
            branchLength: new Decimal('0.5'),
            children: [
              {
                branchLength: new Decimal('0.3'),
                maxBranchLength: new Decimal('0.3'),
                name: 'C',
                size: 1,
                subTreeLeaveNames: [
                  'C',
                ],
                subTreeNames: [],
              },
              {
                branchLength: new Decimal('0.4'),
                maxBranchLength: new Decimal('0.4'),
                name: 'D',
                size: 1,
                subTreeLeaveNames: [
                  'D',
                ],
                subTreeNames: [],
              },
            ],
            maxBranchLength: new Decimal('0.9'),
            name: 'Generated-7225787341756924',
            size: 2,
            subTreeLeaveNames: [
              'C',
              'D',
            ],
            subTreeNames: [
              'C',
              'D',
            ],
          },
        ],
        maxBranchLength: new Decimal('0.9'),
        name: 'Root',
        size: 4,
        subTreeLeaveNames: [
          'A',
          'B',
          'C',
          'D',
        ],
        subTreeNames: [
          'C',
          'D',
        ],
      };
      const tree = NewickUtil.parse(newick);
      expect(tree).toEqual(expectedTree);
    });

    it('should handle a single leaf (no parentheses)', () => {
      const newick = 'A;';
      const expectedTree: Partial<TreeNode> = {
        branchLength: new Decimal(0),
        maxBranchLength: new Decimal(0),
        name: 'Root',
      };

      const tree = NewickUtil.parse(newick);
      expect(tree).toEqual(expectedTree);
    });
  });

  describe('getSortedNames', () => {
    it('should return the name for a leaf node', () => {
      const leaf: TreeNode = { name: 'A' };
      expect(NewickUtil.getSortedNames(leaf)).toEqual(['A']);
    });

    it('should return leaf names in depth-first order for a tree', () => {
      const tree = NewickUtil.parse('(A,B,(C,D));');
      expect(NewickUtil.getSortedNames(tree)).toEqual(['A', 'B', 'C', 'D']);
    });
  });
});
