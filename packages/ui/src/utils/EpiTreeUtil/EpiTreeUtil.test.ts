import Decimal from 'decimal.js';
import {
  afterAll,
  beforeAll,
  vi,
} from 'vitest';
import type { Theme } from '@mui/material/styles';

import { ColType } from '../../api';
import type { TreeAlgorithm } from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';
import type { ArgumentTypes } from '../../models/generic';
import type { Config } from '../../models/config';
import { STRATIFICATION_MODE } from '../../models/epi';
import type {
  Stratification,
  TreeConfiguration,
} from '../../models/epi';
import type {
  TreeAssembly,
  TreeNode,
  TreePathProperties,
} from '../../models/tree';

import { EpiTreeUtil } from './EpiTreeUtil';

// Path2D is a browser API not available in jsdom — provide a minimal stub
if (typeof Path2D === 'undefined') {
  (global as unknown as Record<string, unknown>)['Path2D'] = class {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public arc(): void { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public closePath(): void { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public lineTo(): void { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public moveTo(): void { }
  };
}

// Helpers to build TreeNode objects that mirror what NewickUtil.parse produces
const makeLeaf = (name: string, branchLength = 1): TreeNode => ({
  branchLength: new Decimal(branchLength),
  maxBranchLength: new Decimal(branchLength),
  name,
  size: 1,
  subTreeLeaveNames: [name],
  subTreeNames: [],
});

const makeNode = (name: string, branchLength: number, children: TreeNode[]): TreeNode => ({
  branchLength: new Decimal(branchLength),
  children,
  name,
  size: children.reduce((s, c) => s + (c.size ?? 1), 0),
  subTreeLeaveNames: children.flatMap(c => c.subTreeLeaveNames ?? []),
  // subTreeNames mirrors NewickUtil: for each child include child.name + child.subTreeNames
  subTreeNames: children.flatMap(c => [c.name, ...(c.subTreeNames ?? [])]).filter(Boolean),
});

const getExternalLeafSorting = (rootNode: TreeNode): string[] => {
  if (!rootNode) {
    return [];
  }

  if (!rootNode.children?.length) {
    return [rootNode.name];
  }

  return rootNode.children.flatMap(child => getExternalLeafSorting(child));
};

const assembleTreeForTest = (params: {
  externalLeafSorting?: string[];
  itemHeight: number;
  pixelToGeneticDistanceRatio: number;
  rootNode: TreeNode;
  treeCanvasWidth: number;
}): TreeAssembly => {
  const { externalLeafSorting, ...rest } = params;

  return EpiTreeUtil.assembleTree({
    ...rest,
    externalLeafSorting: externalLeafSorting ?? getExternalLeafSorting(params.rootNode),
  });
};

describe('EpiTreeUtil', () => {
  describe('getScrollPositionFromTreeVisibility', () => {
    const TABLE_ROW_HEIGHT = 30;

    it('returns 0 when scrolled to the top', () => {
      // 30 items total, canvas shows 10, no scroll
      expect(EpiTreeUtil.getScrollPositionFromTreeVisibility({
        itemHeight: TABLE_ROW_HEIGHT,
        treeCanvasHeight: 300,
        treeHeight: 900,
        treeSize: 30,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      })).toBe(0);
    });

    it('returns the correct position when scrolled to the middle', () => {
      // scrolledByItems = 10, maxItemsInView = 10, average = 15
      // newScrollPosition = 15 * 30 - 150 = 300
      expect(EpiTreeUtil.getScrollPositionFromTreeVisibility({
        itemHeight: TABLE_ROW_HEIGHT,
        treeCanvasHeight: 300,
        treeHeight: 900,
        treeSize: 30,
        verticalScrollPosition: 300,
        zoomLevel: 1,
      })).toBe(300);
    });

    it('returns treeHeight - treeCanvasHeight when scrolled past the end', () => {
      // scrolledByItems = 30 (over-scrolled), lastItemInView clamped to treeSize (30)
      // average = 30, newScrollPosition clamped to 900 - 300 = 600
      expect(EpiTreeUtil.getScrollPositionFromTreeVisibility({
        itemHeight: TABLE_ROW_HEIGHT,
        treeCanvasHeight: 300,
        treeHeight: 900,
        treeSize: 30,
        verticalScrollPosition: 900,
        zoomLevel: 1,
      })).toBe(600);
    });

    it('accounts for zoom level when computing scroll position', () => {
      // zoomLevel = 2: scaledItemHeight = 15, maxItemsInView = 20
      // firstItemInView = 0, lastItemInView = min(20, 30) = 20, average = 10
      // newScrollPosition = 10 * 30 - 150 = 150
      expect(EpiTreeUtil.getScrollPositionFromTreeVisibility({
        itemHeight: TABLE_ROW_HEIGHT,
        treeCanvasHeight: 300,
        treeHeight: 900,
        treeSize: 30,
        verticalScrollPosition: 0,
        zoomLevel: 2,
      })).toBe(150);
    });

    it('clamps result to 0 when computed position is negative', () => {
      // Large canvas fits many items; averageItemInView * rowHeight < treeCanvasHeight/2
      // treeCanvasHeight = 600, scrollPosition = 0, treeSize = 10, treeHeight = 300
      // scaledItemHeight = 30, scrolledByItems = 0, maxItemsInView = 20
      // lastItemInView = min(20, 10) = 10, average = 5
      // candidate = 5 * 30 - 300 = -150 → clamped to 0
      expect(EpiTreeUtil.getScrollPositionFromTreeVisibility({
        itemHeight: TABLE_ROW_HEIGHT,
        treeCanvasHeight: 600,
        treeHeight: 300,
        treeSize: 10,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      })).toBe(0);
    });
  });

  describe('getTickMarkScale', () => {
    beforeAll(() => {
      vi.spyOn(ConfigManager.instance, 'config', 'get').mockReturnValue({
        epiTree: {
          MAX_SCALE_WIDTH_PX: 144,
          MIN_SCALE_WIDTH_PX: 48,
          SCALE_INCREMENTS: [1, 2, 5, 10, 20, 50],
        },
      } as Config);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('returns [0,0,0] when treeWidthMinusPadding is 0', () => {
      expect(EpiTreeUtil.getTickMarkScale({
        geneticTreeWidth: new Decimal(80),
        minGeneticScaleUnit: 1,
        treeWidthMinusPadding: 0,
        zoomLevel: 1,
      })).toEqual([0, 0, 0]);
    });

    it('returns [0,0,0] when minGeneticScaleUnit is 0', () => {
      expect(EpiTreeUtil.getTickMarkScale({
        geneticTreeWidth: new Decimal(80),
        minGeneticScaleUnit: 0,
        treeWidthMinusPadding: 1200,
        zoomLevel: 1,
      })).toEqual([0, 0, 0]);
    });

    it('returns [2, minGeneticScaleUnit, minGeneticScaleUnit] when geneticTree fits only 2 lines (maxNumLines clamped to 2, minNumLines > maxNumLines)', () => {
      // geneticTreeWidth=0.8, minGeneticScaleUnit=1:
      // 0.8/1 + 1 = 1.8 < maxNumLines(26) → maxNumLines = max(ceil(0.8), 2) = 2
      // minNumLines(9) > 2 → minNumLines = 2 → maxNumLines === 2 → [2, 1, 1]
      expect(EpiTreeUtil.getTickMarkScale({
        geneticTreeWidth: new Decimal(0.8),
        minGeneticScaleUnit: 1,
        treeWidthMinusPadding: 1200,
        zoomLevel: 1,
      })).toEqual([2, 1, 1]);
    });

    it('clamps maxNumLines and sets minNumLines = maxNumLines when geneticTree has few divisions', () => {
      // geneticTreeWidth=4, minGeneticScaleUnit=1:
      // 4/1 + 1 = 5 < maxNumLines(26) → maxNumLines = max(ceil(4), 2) = 4
      // minNumLines(9) > 4 → minNumLines = 4, maxNumLines = 4
      // numLines=4, increment=1: product=4, leftover=0 → [5, 1, 1]
      expect(EpiTreeUtil.getTickMarkScale({
        geneticTreeWidth: new Decimal(4),
        minGeneticScaleUnit: 1,
        treeWidthMinusPadding: 1200,
        zoomLevel: 1,
      })).toEqual([5, 1, 1]);
    });

    it('skips increments smaller than minGeneticScaleUnit', () => {
      // minGeneticScaleUnit=5 causes increments [1, 2] to be skipped
      // numLines=16, increment=5: product=80, leftover=0 → [17, 5, 5]
      expect(EpiTreeUtil.getTickMarkScale({
        geneticTreeWidth: new Decimal(80),
        minGeneticScaleUnit: 5,
        treeWidthMinusPadding: 1200,
        zoomLevel: 1,
      })).toEqual([17, 5, 5]);
    });

    it('accounts for zoom level by reducing effective width', () => {
      // zoomLevel=2: width=600 → minNumLines=5, maxNumLines=14
      // numLines=8, increment=10: product=80, leftover=0 → [9, 10, 1]
      expect(EpiTreeUtil.getTickMarkScale({
        geneticTreeWidth: new Decimal(80),
        minGeneticScaleUnit: 1,
        treeWidthMinusPadding: 1200,
        zoomLevel: 2,
      })).toEqual([9, 10, 1]);
    });

    it('determines the tick mark scale for various tree widths', () => {
      const cases: Array<[ArgumentTypes<typeof EpiTreeUtil.getTickMarkScale>[0], [number, number, number]]> = [
        [{
          geneticTreeWidth: new Decimal(16),
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [17, 1, 1]],
        [{
          geneticTreeWidth: new Decimal(80),
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [17, 5, 1]],
        [{
          geneticTreeWidth: new Decimal(150),
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [16, 10, 1]],
      ];

      cases.forEach(([input, expectedOutput]) => {
        expect(EpiTreeUtil.getTickMarkScale(input)).toEqual(expectedOutput);
      });
    });
  });

  describe('sanitizeTree', () => {
    it('returns the same root node reference', () => {
      const root = makeNode('Root', 0, [makeLeaf('A'), makeLeaf('B')]);
      expect(EpiTreeUtil.sanitizeTree(root)).toBe(root);
    });

    it('leaves a leaf node (no children) unchanged', () => {
      const leaf = makeLeaf('A');
      EpiTreeUtil.sanitizeTree(leaf);
      expect(leaf.children).toBeUndefined();
      expect(leaf.subTreeNames).toEqual([]);
    });

    it('does not modify children when all branch lengths are positive', () => {
      // Inner has branchLength=1: nodesToMove=[] → splice is a no-op
      const a = makeLeaf('A');
      const b = makeLeaf('B');
      const inner = makeNode('Inner', 1, [b, makeLeaf('C')]);
      const root = makeNode('Root', 0, [a, inner]);

      EpiTreeUtil.sanitizeTree(root);

      expect(root.children?.map(c => c.name)).toEqual(['A', 'Inner']);
    });

    it('collapses a zero-branch-length inner node by hoisting its children', () => {
      // Inner (bl=0) should be removed; its children B, C hoisted to Root
      const a = makeLeaf('A');
      const b = makeLeaf('B');
      const c = makeLeaf('C');
      const inner = makeNode('Inner', 0, [b, c]);
      const root = makeNode('Root', 0, [a, inner]);

      EpiTreeUtil.sanitizeTree(root);

      expect(root.children?.map(n => n.name)).toEqual(['A', 'B', 'C']);
    });

    it('removes the collapsed node name from subTreeNames', () => {
      // Root.subTreeNames starts as ['A', 'Inner', 'B', 'C']; 'Inner' should be removed
      const root = makeNode('Root', 0, [
        makeLeaf('A'),
        makeNode('Inner', 0, [makeLeaf('B'), makeLeaf('C')]),
      ]);

      EpiTreeUtil.sanitizeTree(root);

      expect(root.subTreeNames).toEqual(['A', 'B', 'C']);
    });

    it('does not collapse a non-zero-branch inner node and leaves subTreeNames intact', () => {
      const inner = makeNode('Inner', 1, [makeLeaf('B'), makeLeaf('C')]);
      const root = makeNode('Root', 0, [makeLeaf('A'), inner]);
      const originalSubTreeNames = [...root.subTreeNames];

      EpiTreeUtil.sanitizeTree(root);

      expect(root.children?.map(n => n.name)).toEqual(['A', 'Inner']);
      expect(root.subTreeNames).toEqual(originalSubTreeNames);
    });

    it('treats a node with undefined branchLength as zero-branch (uses ?? 0 fallback)', () => {
      // inner has no branchLength property → branchLength?.toNumber() ?? 0 === 0 → treated as zero-branch
      const inner = {
        children: [makeLeaf('B'), makeLeaf('C')],
        name: 'Inner',
        size: 2,
        subTreeLeaveNames: ['B', 'C'],
        subTreeNames: ['B', 'C'],
      } as TreeNode;
      const root = makeNode('Root', 0, [makeLeaf('A'), inner]);

      EpiTreeUtil.sanitizeTree(root);

      // inner treated as zero-branch → its children B,C hoisted to root
      expect(root.children?.map(n => n.name)).toEqual(['A', 'B', 'C']);
    });

    it('collapses multiple zero-branch inner nodes at the same level', () => {
      // Both Inner1 and Inner2 (bl=0) should be collapsed
      const root = makeNode('Root', 0, [
        makeNode('Inner1', 0, [makeLeaf('A'), makeLeaf('B')]),
        makeNode('Inner2', 0, [makeLeaf('C'), makeLeaf('D')]),
      ]);

      EpiTreeUtil.sanitizeTree(root);

      expect(root.children?.map(n => n.name)).toEqual(['A', 'B', 'C', 'D']);
      expect(root.subTreeNames).toEqual(['A', 'B', 'C', 'D']);
    });

    it('collapses only zero-branch inner nodes when mixed with non-zero ones', () => {
      // Inner1 (bl=0) collapsed; Inner2 (bl=1) kept
      const root = makeNode('Root', 0, [
        makeNode('Inner1', 0, [makeLeaf('A'), makeLeaf('B')]),
        makeNode('Inner2', 1, [makeLeaf('C'), makeLeaf('D')]),
      ]);

      EpiTreeUtil.sanitizeTree(root);

      expect(root.children?.map(n => n.name)).toEqual(['A', 'B', 'Inner2']);
      expect(root.subTreeNames).toEqual(['A', 'B', 'Inner2', 'C', 'D']);
    });

    it('collapses deeply nested zero-branch nodes level by level', () => {
      // Outer(bl=0) -> [Inner(bl=0) -> [B, C], D]
      // Inner first collapsed into Outer → Outer.children=[B,C,D]
      // Then Outer collapsed into Root → Root.children=[A,B,C,D]
      const b = makeLeaf('B');
      const c = makeLeaf('C');
      const inner = makeNode('Inner', 0, [b, c]);
      const d = makeLeaf('D');
      const outer = makeNode('Outer', 0, [inner, d]);
      const a = makeLeaf('A');
      const root = makeNode('Root', 0, [a, outer]);

      EpiTreeUtil.sanitizeTree(root);

      expect(root.children?.map(n => n.name)).toEqual(['A', 'B', 'C', 'D']);
    });

    it("retains orphaned ancestor names in ancestor's subTreeNames after deep collapse", () => {
      // Root.subTreeNames initially: ['A','Outer','Inner','B','C','D']
      // After collapse: 'Outer' is spliced out but 'Inner' (already listed before 'Outer') remains
      const root = makeNode('Root', 0, [
        makeLeaf('A'),
        makeNode('Outer', 0, [
          makeNode('Inner', 0, [makeLeaf('B'), makeLeaf('C')]),
          makeLeaf('D'),
        ]),
      ]);

      EpiTreeUtil.sanitizeTree(root);

      // 'Outer' is removed; 'Inner' stays because it was spliced from Outer (not Root) subTreeNames
      expect(root.subTreeNames).toEqual(['A', 'Inner', 'B', 'C', 'D']);
    });
  });

  describe('createTreeAddresses', () => {
    it('assigns an empty string address to a single root leaf', () => {
      const root = makeLeaf('root');
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({ root: '' });
    });

    it('treats a child with undefined branchLength as zero-branch (uses ?? 0 fallback)', () => {
      // child has no branchLength → (child.branchLength?.toNumber() ?? 0) === 0 → assigned index 1
      const zeroBLChild = { name: 'z', size: 1, subTreeLeaveNames: ['z'], subTreeNames: [] } as TreeNode;
      const root = makeNode('root', 0, [zeroBLChild, makeLeaf('a', 1)]);
      const addresses = EpiTreeUtil.createTreeAddresses(root);
      expect(addresses['z']).toBe('1');
      expect(addresses['a']).toBe('2');
    });

    it('assigns "" to the root and "1","2" to two positive-branch children', () => {
      // No zero-branch children → index starts at 1
      const root = makeNode('root', 0, [makeLeaf('a'), makeLeaf('b')]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '1',
        b: '2',
        root: '',
      });
    });

    it('increments index for each additional positive-branch child', () => {
      // Three positive-branch children → "1", "2", "3"
      const root = makeNode('root', 0, [makeLeaf('a'), makeLeaf('b'), makeLeaf('c')]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '1',
        b: '2',
        c: '3',
        root: '',
      });
    });

    it('assigns address "1" to a single zero-branch child', () => {
      // hasZeroBranchLength=true → zero-branch children always get index 1
      const root = makeNode('root', 0, [makeLeaf('a', 0)]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '1',
        root: '',
      });
    });

    it('assigns "1" to zero-branch child and "2" to following positive-branch child', () => {
      // hasZeroBranchLength=true → index starts at 2 for non-zero; zero child gets 1
      const root = makeNode('root', 0, [makeLeaf('a', 0), makeLeaf('b', 1)]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '1',
        b: '2',
        root: '',
      });
    });

    it('assigns "2" to a positive-branch child that appears before a zero-branch child', () => {
      // hasZeroBranchLength=true → non-zero children start at index 2, zero gets 1
      const root = makeNode('root', 0, [makeLeaf('a', 1), makeLeaf('b', 0)]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '2',
        b: '1',
        root: '',
      });
    });

    it('assigns "1" to all zero-branch children when every child has zero branch length', () => {
      // All children route to the same index 1
      const root = makeNode('root', 0, [makeLeaf('a', 0), makeLeaf('b', 0), makeLeaf('c', 0)]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '1',
        b: '1',
        c: '1',
        root: '',
      });
    });

    it('builds dot-notation addresses recursively for a two-level tree', () => {
      // root → [left(bl=1) → [a(bl=1), b(bl=1)], right(bl=1)]
      // root: "", left: "1", a: "1.1", b: "1.2", right: "2"
      const left = makeNode('left', 1, [makeLeaf('a'), makeLeaf('b')]);
      const root = makeNode('root', 0, [left, makeLeaf('right')]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '1.1',
        b: '1.2',
        left: '1',
        right: '2',
        root: '',
      });
    });

    it('correctly addresses a zero-branch inner node and its children', () => {
      // root → [inner(bl=0) → [a(bl=1), b(bl=1)], c(bl=1)]
      // hasZero=true at root level → inner: "1", c: "2"
      // At inner level, no zero-branch → a: "1.1", b: "1.2"
      const inner = makeNode('inner', 0, [makeLeaf('a'), makeLeaf('b')]);
      const root = makeNode('root', 0, [inner, makeLeaf('c')]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        a: '1.1',
        b: '1.2',
        c: '2',
        inner: '1',
        root: '',
      });
    });

    it('correctly addresses a three-level deep tree with mixed branch lengths', () => {
      // root → [x(bl=0) → [y(bl=1) → [p(bl=1), q(bl=1)]], z(bl=1)]
      // root level: hasZero=true → x: "1", z: "2"
      // x level: no zero-branch → y: "1.1"
      // y level: no zero-branch → p: "1.1.1", q: "1.1.2"
      const y = makeNode('y', 1, [makeLeaf('p'), makeLeaf('q')]);
      const x = makeNode('x', 0, [y]);
      const root = makeNode('root', 0, [x, makeLeaf('z')]);
      expect(EpiTreeUtil.createTreeAddresses(root)).toEqual({
        p: '1.1.1',
        q: '1.1.2',
        root: '',
        x: '1',
        y: '1.1',
        z: '2',
      });
    });
  });

  describe('findNewTreeRoot', () => {
    it("selector 'node': returns a new object — not the original node reference", () => {
      const target = { ...makeLeaf('target', 3), maxBranchLength: new Decimal(10) };
      const root = makeNode('root', 0, [target]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'node');
      expect(result).not.toBe(target);
    });

    it("selector 'node': sets branchLength to 0 on the matched node", () => {
      const target = { ...makeLeaf('target', 3), maxBranchLength: new Decimal(10) };
      const root = makeNode('root', 0, [target]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'node');
      expect(result.branchLength.toNumber()).toBe(0);
    });

    it("selector 'node': adjusts maxBranchLength by subtracting the original branchLength", () => {
      // maxBranchLength=10, branchLength=3 → result maxBranchLength = 7
      const target = { ...makeLeaf('target', 3), maxBranchLength: new Decimal(10) };
      const root = makeNode('root', 0, [target]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'node');
      expect(result.maxBranchLength.toNumber()).toBe(7);
    });

    it("selector 'node': preserves other properties of the matched node", () => {
      const target = { ...makeLeaf('target', 3), maxBranchLength: new Decimal(10) };
      const root = makeNode('root', 0, [target]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'node');
      expect(result.name).toBe('target');
      expect(result.subTreeLeaveNames).toEqual(['target']);
    });

    it("selector 'node': matches the root node itself when name equals nodeName", () => {
      const root: TreeNode = {
        branchLength: new Decimal(2),
        children: [makeLeaf('a')],
        maxBranchLength: new Decimal(8),
        name: 'root',
        size: 1,
        subTreeLeaveNames: ['a'],
        subTreeNames: ['a'],
      };
      const result = EpiTreeUtil.findNewTreeRoot(root, 'root', 'node');
      expect(result.name).toBe('root');
      expect(result.branchLength.toNumber()).toBe(0);
      expect(result.maxBranchLength.toNumber()).toBe(6); // 8 - 2
    });

    it("selector 'node': finds a direct child leaf", () => {
      const target = { ...makeLeaf('target', 4), maxBranchLength: new Decimal(12) };
      const root = makeNode('root', 0, [makeLeaf('other'), target]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'node');
      expect(result.name).toBe('target');
      expect(result.branchLength.toNumber()).toBe(0);
      expect(result.maxBranchLength.toNumber()).toBe(8); // 12 - 4
    });

    it("selector 'node': finds a deeply nested node", () => {
      const deepTarget = { ...makeLeaf('deepTarget', 5), maxBranchLength: new Decimal(15) };
      const inner = makeNode('inner', 2, [deepTarget, makeLeaf('sibling')]);
      const root = makeNode('root', 0, [makeLeaf('unrelated'), inner]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'deepTarget', 'node');
      expect(result.name).toBe('deepTarget');
      expect(result.branchLength.toNumber()).toBe(0);
      expect(result.maxBranchLength.toNumber()).toBe(10); // 15 - 5
    });

    it("selector 'parent': returns root when matched child is a direct child of root", () => {
      const root: TreeNode = {
        branchLength: new Decimal(0),
        children: [makeLeaf('a'), makeLeaf('b')],
        maxBranchLength: new Decimal(10),
        name: 'root',
        size: 2,
        subTreeLeaveNames: ['a', 'b'],
        subTreeNames: ['a', 'b'],
      };
      const result = EpiTreeUtil.findNewTreeRoot(root, 'a', 'parent');
      expect(result.name).toBe('root');
      expect(result.branchLength.toNumber()).toBe(0);
      expect(result.maxBranchLength.toNumber()).toBe(10); // 10 - 0
    });

    it("selector 'parent': returns the immediate parent of a second-level node", () => {
      const parent: TreeNode = {
        branchLength: new Decimal(3),
        children: [makeLeaf('target'), makeLeaf('sibling')],
        maxBranchLength: new Decimal(9),
        name: 'parent',
        size: 2,
        subTreeLeaveNames: ['target', 'sibling'],
        subTreeNames: ['target', 'sibling'],
      };
      const root = makeNode('root', 0, [makeLeaf('unrelated'), parent]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'parent');
      expect(result.name).toBe('parent');
      expect(result.branchLength.toNumber()).toBe(0);
      expect(result.maxBranchLength.toNumber()).toBe(6); // 9 - 3
    });

    it("selector 'parent': preserves the children and other properties of the matched parent", () => {
      const parent: TreeNode = {
        branchLength: new Decimal(1),
        children: [makeLeaf('target'), makeLeaf('sibling')],
        maxBranchLength: new Decimal(5),
        name: 'parent',
        size: 2,
        subTreeLeaveNames: ['target', 'sibling'],
        subTreeNames: ['target', 'sibling'],
      };
      const root = makeNode('root', 0, [parent]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'parent');
      expect(result.children).toBe(parent.children);
      expect(result.subTreeLeaveNames).toEqual(['target', 'sibling']);
    });

    it("selector 'node': when branchLength equals maxBranchLength the adjusted maxBranchLength is 0", () => {
      // branchLength=5, maxBranchLength=5 → maxBranchLength result = 0
      const target = { ...makeLeaf('target', 5), maxBranchLength: new Decimal(5) };
      const root = makeNode('root', 0, [target]);
      const result = EpiTreeUtil.findNewTreeRoot(root, 'target', 'node');
      expect(result.branchLength.toNumber()).toBe(0);
      expect(result.maxBranchLength.toNumber()).toBe(0);
    });
  });

  describe('getMinGeneticScaleUnit', () => {
    it('returns Infinity when passed a falsy value', () => {
      expect(EpiTreeUtil.getMinGeneticScaleUnit(null)).toBe(Infinity);
    });

    it('returns the branchLength of a single leaf node', () => {
      expect(EpiTreeUtil.getMinGeneticScaleUnit(makeLeaf('a', 3))).toBe(3);
    });

    it('returns Infinity for a leaf whose branchLength is 0 (zero is treated as missing)', () => {
      expect(EpiTreeUtil.getMinGeneticScaleUnit(makeLeaf('a', 0))).toBe(Infinity);
    });

    it('returns Infinity for a leaf with no branchLength set', () => {
      const leaf: TreeNode = { name: 'a', size: 1, subTreeLeaveNames: ['a'], subTreeNames: [] };
      expect(EpiTreeUtil.getMinGeneticScaleUnit(leaf)).toBe(Infinity);
    });

    it('returns the minimum among multiple leaf children', () => {
      // leaves: 3, 1, 7 → min = 1
      const root = makeNode('root', 0, [makeLeaf('a', 3), makeLeaf('b', 1), makeLeaf('c', 7)]);
      expect(EpiTreeUtil.getMinGeneticScaleUnit(root)).toBe(1);
    });

    it('ignores internal (non-leaf) node branch lengths when finding the minimum', () => {
      // inner branchLength=0.5 (very small) but it has children → should be ignored
      // leaf b branchLength=2 is the true minimum
      const inner = makeNode('inner', 0.5, [makeLeaf('b', 2), makeLeaf('c', 5)]);
      const root = makeNode('root', 0, [makeLeaf('a', 3), inner]);
      expect(EpiTreeUtil.getMinGeneticScaleUnit(root)).toBe(2);
    });

    it('skips zero-branch leaves and returns the minimum positive one', () => {
      // leaf a=0 (skipped), leaf b=4, leaf c=2 → min = 2
      const root = makeNode('root', 0, [makeLeaf('a', 0), makeLeaf('b', 4), makeLeaf('c', 2)]);
      expect(EpiTreeUtil.getMinGeneticScaleUnit(root)).toBe(2);
    });

    it('returns Infinity when all leaves have zero branchLength', () => {
      const root = makeNode('root', 0, [makeLeaf('a', 0), makeLeaf('b', 0)]);
      expect(EpiTreeUtil.getMinGeneticScaleUnit(root)).toBe(Infinity);
    });

    it('traverses deeply nested leaves correctly', () => {
      // root → inner → deep leaf with branchLength=0.1 (smallest)
      // other leaves: 5, 3
      const deep = makeLeaf('deep', 0.1);
      const inner = makeNode('inner', 2, [deep, makeLeaf('sibling', 3)]);
      const root = makeNode('root', 0, [makeLeaf('a', 5), inner]);
      expect(EpiTreeUtil.getMinGeneticScaleUnit(root)).toBe(0.1);
    });

    it('handles a tree where the root is itself a leaf (no children)', () => {
      const leaf = makeLeaf('solo', 7);
      expect(EpiTreeUtil.getMinGeneticScaleUnit(leaf)).toBe(7);
    });

    it('returns the sole positive leaf value when only one leaf has a positive branchLength', () => {
      const root = makeNode('root', 0, [makeLeaf('a', 0), makeLeaf('b', 0), makeLeaf('c', 6)]);
      expect(EpiTreeUtil.getMinGeneticScaleUnit(root)).toBe(6);
    });
  });

  describe('assembleTree', () => {
    const TABLE_ROW_HEIGHT = 30;
    const TREE_PADDING = 10;
    const LEAF_DOT_RADIUS = 4;
    const ANCESTOR_DOT_RADIUS = 3;
    const MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL = 5;
    const pixelToGeneticDistanceRatio = 100;
    const treeCanvasWidth = 800;

    beforeAll(() => {
      vi.spyOn(ConfigManager.instance, 'config', 'get').mockReturnValue({
        epiTree: {
          ANCESTOR_DOT_RADIUS,
          LEAF_DOT_RADIUS,
          MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL,
          TREE_PADDING,
        },
      } as Config);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('returns an assembly with empty arrays for a single leaf (no ancestors)', () => {
      // leaf a: distance=0, bl=2 → leafXPxEnd=210, leafYPx=15, leafXPxStart=10
      const tree = makeLeaf('a', 2);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.leafNodes).toHaveLength(1);
      expect(asm.leafNodes[0].nodeName).toBe('a');
      expect(asm.leafTreeLines).toHaveLength(1);
      expect(asm.leafTreeLines[0].nodeName).toBe('a');
      expect(asm.ancestorNodes).toHaveLength(0);
      expect(asm.horizontalAncestorTreeLines).toHaveLength(0);
      expect(asm.verticalAncestorTreeLines).toHaveLength(0);
      expect(asm.nodePathPropertiesMap.size).toBe(1);
      expect(asm.horizontalLinePathPropertiesMap.size).toBe(1);
      expect(asm.verticalLinePathPropertiesMap.size).toBe(0);
    });

    it('produces correct support line coordinates for a single leaf', () => {
      // leafXPxEnd = (0+2)*100+10 = 210, leafYPx = 15
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: makeLeaf('a', 2), treeCanvasWidth });
      expect(asm.supportLines).toEqual([{ fromX: 210, fromY: 15, nodeName: 'a', toX: treeCanvasWidth, toY: 15 }]);
    });

    it('produces one entry per leaf in leafNodes, leafTreeLines, and supportLines for a two-leaf tree', () => {
      // root(bl=0) → [a(bl=2), b(bl=3)]
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.leafNodes).toHaveLength(2);
      expect(asm.leafTreeLines).toHaveLength(2);
      expect(asm.supportLines).toHaveLength(2);
    });

    it('DFS leaf ordering is reflected in support line Y positions', () => {
      // root(bl=0) → [a(bl=2), b(bl=3)]
      // a at leafIndex=0: y=15; b at leafIndex=1: y=45
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.supportLines[0]).toEqual({ fromX: 210, fromY: 15, nodeName: 'a', toX: treeCanvasWidth, toY: 15 });
      expect(asm.supportLines[1]).toEqual({ fromX: 310, fromY: 45, nodeName: 'b', toX: treeCanvasWidth, toY: 45 });
    });

    it('uses external leaf sorting to set support line target positions', () => {
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({
        externalLeafSorting: ['b', 'a'],
        itemHeight: TABLE_ROW_HEIGHT,
        pixelToGeneticDistanceRatio,
        rootNode: tree,
        treeCanvasWidth,
      });

      expect(asm.supportLines[0]).toEqual({ fromX: 210, fromY: 15, nodeName: 'a', toX: treeCanvasWidth, toY: 45 });
      expect(asm.supportLines[1]).toEqual({ fromX: 310, fromY: 45, nodeName: 'b', toX: treeCanvasWidth, toY: 15 });
    });

    it('produces one horizontalAncestorTreeLine and two verticalAncestorTreeLines for a two-leaf tree', () => {
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.horizontalAncestorTreeLines).toHaveLength(1);
      expect(asm.verticalAncestorTreeLines).toHaveLength(2);
    });

    it("includes all descendant leaf names in the ancestor's horizontalAncestorTreeLine nodeNames", () => {
      // root horizontal line nodeNames = ['root', 'a', 'b']
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.horizontalAncestorTreeLines[0].nodeNames).toEqual(['root', 'a', 'b']);
    });

    it('adds an ancestor dot when all children have positive branch lengths', () => {
      // both a and b have bl > 0 → ancestor dot
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.ancestorNodes).toHaveLength(1);
      expect(asm.ancestorNodes[0].nodeNames).toContain('root');
    });

    it('does NOT add an ancestor dot when a child has zero branch length', () => {
      // leaf 'a' has bl=0 → root.children.every(bl > 0) is false → no dot
      const tree = makeNode('root', 0, [makeLeaf('a', 0), makeLeaf('b', 2)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.ancestorNodes).toHaveLength(0);
    });

    it('correctly sizes all maps for a two-leaf tree', () => {
      // nodePathPropertiesMap: 2 leaf dots + 1 ancestor dot = 3
      // horizontalLinePathPropertiesMap: 2 leaf lines + 1 ancestor line = 3
      // verticalLinePathPropertiesMap: 2 vertical lines
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.nodePathPropertiesMap.size).toBe(3);
      expect(asm.horizontalLinePathPropertiesMap.size).toBe(3);
      expect(asm.verticalLinePathPropertiesMap.size).toBe(2);
    });

    it('stores correct subTreeLeaveNames for a leaf in nodePathPropertiesMap', () => {
      const leafA = makeLeaf('a', 2);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: leafA, treeCanvasWidth });

      const values = [...asm.nodePathPropertiesMap.values()];
      expect(values[0].subTreeLeaveNames).toEqual(['a']);
      expect(values[0].treeNode).toBe(leafA);
    });

    it('stores correct subTreeLeaveNames for an ancestor in horizontalLinePathPropertiesMap', () => {
      // ancestor line subTreeLeaveNames = caseIds = ['a', 'b']
      const tree = makeNode('root', 0, [makeLeaf('a', 2), makeLeaf('b', 3)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      // The ancestor's horizontal line is the last entry (added after the two leaf lines)
      const mapValues = [...asm.horizontalLinePathPropertiesMap.values()];
      const ancestorEntry = mapValues.find(v => v.subTreeLeaveNames.length === 2);
      expect(ancestorEntry?.subTreeLeaveNames).toEqual(['a', 'b']);
    });

    it('correctly assembles a three-leaf tree with two levels', () => {
      // root(bl=0) → [left(bl=1) → [a(bl=1), b(bl=1)], c(bl=2)]
      // leaf a: distance=1, y=15; leaf b: distance=1, y=45; leaf c: distance=0, y=75
      const tree = makeNode('root', 0, [
        makeNode('left', 1, [makeLeaf('a', 1), makeLeaf('b', 1)]),
        makeLeaf('c', 2),
      ]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.leafNodes).toHaveLength(3);
      expect(asm.leafNodes.map(n => n.nodeName)).toEqual(['a', 'b', 'c']);
      expect(asm.horizontalAncestorTreeLines).toHaveLength(2);
      expect(asm.ancestorNodes).toHaveLength(2); // both 'left' and 'root' have positive-branch children
      // 2 vertical lines for 'left' + 2 for 'root'
      expect(asm.verticalAncestorTreeLines).toHaveLength(4);
    });

    it('produces correct support lines for a three-leaf tree in DFS order', () => {
      // root(bl=0) → [left(bl=1) → [a(bl=1), b(bl=1)], c(bl=2)]
      // a: leafXPxEnd=(1+1)*100+10=210, y=15
      // b: leafXPxEnd=210, y=45
      // c: leafXPxEnd=(0+2)*100+10=210, y=75
      const tree = makeNode('root', 0, [
        makeNode('left', 1, [makeLeaf('a', 1), makeLeaf('b', 1)]),
        makeLeaf('c', 2),
      ]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.supportLines[0]).toEqual({ fromX: 210, fromY: 15, nodeName: 'a', toX: treeCanvasWidth, toY: 15 });
      expect(asm.supportLines[1]).toEqual({ fromX: 210, fromY: 45, nodeName: 'b', toX: treeCanvasWidth, toY: 45 });
      expect(asm.supportLines[2]).toEqual({ fromX: 210, fromY: 75, nodeName: 'c', toX: treeCanvasWidth, toY: 75 });
    });

    it('ancestor horizontal line in a three-leaf tree includes all descendant leaf names', () => {
      // root horizontal line nodeNames = ['root', 'a', 'b', 'c']
      const tree = makeNode('root', 0, [
        makeNode('left', 1, [makeLeaf('a', 1), makeLeaf('b', 1)]),
        makeLeaf('c', 2),
      ]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      const rootLine = asm.horizontalAncestorTreeLines.find(l => l.nodeNames[0] === 'root');
      expect(rootLine?.nodeNames).toEqual(['root', 'a', 'b', 'c']);
    });

    it('produces distance label texts when rootNode.maxBranchLength is set and branches are significant', () => {
      // root.maxBranchLength=10; a.bl=5 → 5/10*100=50% >= 5% → label; b.bl=10 → 100% → label
      // labelPrecision = max(1, 4 - len('10')) = max(1, 2) = 2
      // round(5, 2)='5', round(10, 2)='10'
      const rootNode: TreeNode = {
        ...makeNode('root', 0, [makeLeaf('a', 5), makeLeaf('b', 10)]),
        maxBranchLength: new Decimal(10),
      };
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode, treeCanvasWidth });

      expect(asm.distanceTexts).toHaveLength(2);
      expect(asm.distanceTexts[0].nodeNames).toEqual(['a']);
      expect(asm.distanceTexts[0].text).toBe('5');
      expect(asm.distanceTexts[1].nodeNames).toEqual(['b']);
      expect(asm.distanceTexts[1].text).toBe('10');
    });

    it('suppresses distance labels for branches below MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL', () => {
      // root.maxBranchLength=100; a.bl=4 → 4% < 5% → no label; b.bl=10 → 10% → label
      const rootNode: TreeNode = {
        ...makeNode('root', 0, [makeLeaf('a', 4), makeLeaf('b', 10)]),
        maxBranchLength: new Decimal(100),
      };
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode, treeCanvasWidth });

      expect(asm.distanceTexts).toHaveLength(1);
      expect(asm.distanceTexts[0].nodeNames).toEqual(['b']);
    });

    it('produces no distance texts when rootNode has no maxBranchLength', () => {
      // makeNode does not set maxBranchLength → all labels suppressed
      const tree = makeNode('root', 0, [makeLeaf('a', 5), makeLeaf('b', 10)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });

      expect(asm.distanceTexts).toHaveLength(0);
    });

    it('returns an empty assembly for a null rootNode without throwing', () => {
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: null as unknown as TreeNode, treeCanvasWidth });
      expect(asm.leafNodes).toHaveLength(0);
      expect(asm.ancestorNodes).toHaveLength(0);
    });

    it('handles a leaf node with undefined branchLength gracefully (uses ?? 0 fallback)', () => {
      // leaf without branchLength → branchLength?.toNumber() ?? 0 === 0
      const leafNoBL = { name: 'x', size: 1, subTreeLeaveNames: ['x'], subTreeNames: [] } as TreeNode;
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: leafNoBL, treeCanvasWidth });
      expect(asm.leafNodes).toHaveLength(1);
      // leafXPxEnd = (0 + 0)*100 + TREE_PADDING = 10
      expect(asm.supportLines[0]).toEqual({ fromX: 10, fromY: 15, nodeName: 'x', toX: treeCanvasWidth, toY: 15 });
    });

    it('handles a child with undefined branchLength via ?? 0 fallback in the every() check', () => {
      // childNoBL has branchLength: undefined → every(bl > 0) uses ?? 0 → 0 > 0 = false → no dot
      const childNoBL = { name: 'a', size: 1, subTreeLeaveNames: ['a'], subTreeNames: [] } as TreeNode;
      const root = makeNode('root', 0, [childNoBL, makeLeaf('b', 0)]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: root, treeCanvasWidth });
      expect(asm.leafNodes).toHaveLength(2);
      expect(asm.ancestorNodes).toHaveLength(0);
    });

    it('handles an ancestor node with undefined branchLength via ?? 0 fallback in traverseTree and assembleAncestorNode', () => {
      // ancestorNoBL has branchLength: undefined
      // L316: traverseTree(child, distance + (ancestorNoBL.branchLength?.toNumber() ?? 0)) fires ?? 0
      // L408: ancestorXPxDistance = (node.branchLength?.toNumber() ?? 0) * ratio fires ?? 0
      const ancestorNoBL = {
        children: [makeLeaf('a', 1), makeLeaf('b', 1)],
        name: 'anc',
        size: 2,
        subTreeLeaveNames: ['a', 'b'],
        subTreeNames: ['a', 'b'],
      } as unknown as TreeNode;
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: ancestorNoBL, treeCanvasWidth });
      expect(asm.leafNodes).toHaveLength(2);
      expect(asm.ancestorNodes).toHaveLength(1); // both children have positive BL
    });

    it('invokes sort comparators when multiple children fall on the same side of the ancestor midpoint', () => {
      // 4 leaves at y=[15,45,75,105]; ancestorYPx=(15+105)/2=60
      // top group: a(15<60), b(45<60) → 2 elements → sort(a,b) => comparator invoked
      // bottom group: c(75>60), d(105>60) → 2 elements → sort(c,d) => comparator invoked
      const tree = makeNode('root', 0, [
        makeLeaf('a', 1),
        makeLeaf('b', 1),
        makeLeaf('c', 1),
        makeLeaf('d', 1),
      ]);
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode: tree, treeCanvasWidth });
      // 4 vertical chunk paths: 2 for top group (each chunk ending at ancestorYPx) + 2 for bottom group
      expect(asm.verticalAncestorTreeLines.length).toBeGreaterThanOrEqual(4);
    });

    it('adds distance text for an ancestor node with a significant branch length', () => {
      // inner.bl=5 is 50% of maxBranchLength=10, which is >= MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL=5%
      const inner = makeNode('inner', 5, [makeLeaf('a', 5), makeLeaf('b', 5)]);
      const rootNode: TreeNode = {
        ...makeNode('root', 0, [inner]),
        maxBranchLength: new Decimal(10),
      };
      const asm = assembleTreeForTest({ itemHeight: TABLE_ROW_HEIGHT, pixelToGeneticDistanceRatio, rootNode, treeCanvasWidth });
      const ancestorText = asm.distanceTexts.find(t => t.nodeNames.includes('inner'));
      expect(ancestorText).toBeDefined();
    });
  });

  describe('getNewScrollPositionForZoomLevel', () => {
    // Uses global devicePixelRatio which is 1 in jsdom env

    it('returns 0 when both scrollPosition and eventOffset are 0', () => {
      expect(EpiTreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: 1,
        dimensionSize: 1000,
        eventOffset: 0,
        newZoomLevel: 2,
        scrollPosition: 0,
      })).toBe(0);
    });

    it('returns a negative adjustment when zooming in with cursor to the right of origin', () => {
      // devicePixelRatio=1; fullSizePos=(100+0)*1=100; curr=100/1=100; new=100/2=50; result=0-(100-50)=-50
      expect(EpiTreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: 1,
        dimensionSize: 1000,
        eventOffset: 100,
        newZoomLevel: 2,
        scrollPosition: 0,
      })).toBe(-50);
    });

    it('returns 0 when scrollPosition offsets the eventOffset exactly after zoom', () => {
      // fullSizePos=(100+100)*1=200; curr=200/1=200; new=200/2=100; result=100-(200-100)=0
      expect(EpiTreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: 1,
        dimensionSize: 1000,
        eventOffset: 100,
        newZoomLevel: 2,
        scrollPosition: 100,
      })).toBe(0);
    });

    it('halves the scroll when zooming from 1 to 2 with cursor at the left edge', () => {
      // fullSizePos=(0+200)*1=200; curr=200; new=100; result=200-(200-100)=100
      expect(EpiTreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: 1,
        dimensionSize: 1000,
        eventOffset: 0,
        newZoomLevel: 2,
        scrollPosition: 200,
      })).toBe(100);
    });

    it('increases scroll when zooming out from 2 to 1', () => {
      // fullSizePos=(0+200)*2=400; curr=400/2=200; new=400/1=400; result=200-(200-400)=400
      expect(EpiTreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: 2,
        dimensionSize: 1000,
        eventOffset: 0,
        newZoomLevel: 1,
        scrollPosition: 200,
      })).toBe(400);
    });
  });

  describe('getSanitizedScrollPosition', () => {
    const TREE_PADDING = 10;
    const HEADER_HEIGHT = 40;

    beforeAll(() => {
      vi.spyOn(ConfigManager.instance, 'config', 'get').mockReturnValue({
        epiTree: {
          HEADER_HEIGHT,
          TREE_PADDING,
        },
      } as Config);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('clamps positionY to 0 when linked at zoom=1 and treeHeight < treeCanvasHeight', () => {
      const result = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: true,
        positionX: 0,
        positionY: 999,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 200,
      });
      expect(result.newPositionY).toBe(0);
    });

    it('clamps positionY to [0, treeHeight - treeCanvasHeight] when linked at zoom=1', () => {
      // treeHeight=600, treeCanvasHeight=300, devicePixelRatio=1 → max=300
      const clamped = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: true,
        positionX: 0,
        positionY: 999,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(clamped.newPositionY).toBe(300);

      const atMin = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: true,
        positionX: 0,
        positionY: -50,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(atMin.newPositionY).toBe(0);
    });

    it('passes positionY through unchanged when within linked bounds', () => {
      const result = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: true,
        positionX: 0,
        positionY: 150,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(result.newPositionY).toBe(150);
    });

    it('applies wider Y bounds when not linked (allows negative Y)', () => {
      // positionYMin = -300 + 10 + 40 = -250; positionYMax = 600 - 10 - 40 = 550
      const clampedMax = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: false,
        positionX: 0,
        positionY: 1000,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(clampedMax.newPositionY).toBe(550);

      const clampedMin = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: false,
        positionX: 0,
        positionY: -1000,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(clampedMin.newPositionY).toBe(-250);
    });

    it('clamps positionX to [positionXMin, positionXMax]', () => {
      // positionXMin = -400 + 2*10 = -380; positionXMax = 400 - 2*10 = 380
      const maxClamped = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: false,
        positionX: 999,
        positionY: 0,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(maxClamped.newPositionX).toBe(380);

      const minClamped = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: false,
        positionX: -999,
        positionY: 0,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(minClamped.newPositionX).toBe(-380);
    });

    it('passes positionX through unchanged when within bounds', () => {
      const result = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 1,
        internalZoomLevel: 1,
        isLinked: false,
        positionX: 100,
        positionY: 0,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(result.newPositionX).toBe(100);
    });

    it('uses divePixelRatioOffset=0 via the ?? fallback when devicePixelRatio exceeds all thresholds', () => {
      // With dpr=4 > 3 (max threshold), thresholds.find returns undefined → ?? 0 fires
      // positionYMax = (600*4) - (300*4) - 0 = 1200; positionY=999 < 1200 → no clamping
      const result = EpiTreeUtil.getSanitizedScrollPosition({
        devicePixelRatio: 4,
        internalZoomLevel: 1,
        isLinked: true,
        positionX: 0,
        positionY: 999,
        treeCanvasHeight: 300,
        treeCanvasWidth: 400,
        treeHeight: 600,
      });
      expect(result.newPositionY).toBe(999);
    });
  });

  describe('drawDivider', () => {
    const makeCtx = () => ({
      beginPath: vi.fn(),
      closePath: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      fillText: vi.fn(),
      lineTo: vi.fn(),
      lineWidth: 0,
      moveTo: vi.fn(),
      scale: vi.fn(),
      setLineDash: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      translate: vi.fn(),
    });

    it('draws a horizontal line at the specified y position', () => {
      const ctx = makeCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 400,
        width: 600,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawDivider({ canvas, devicePixelRatio: 1, y: 20 });

      expect(ctx.moveTo).toHaveBeenCalledWith(0, 20);
      expect(ctx.lineTo).toHaveBeenCalledWith(600, 20);
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('calls stroke with lineWidth 1', () => {
      const ctx = makeCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 400,
        width: 600,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawDivider({ canvas, devicePixelRatio: 1, y: 5 });

      expect(ctx.stroke).toHaveBeenCalledTimes(1);
      expect(ctx.beginPath).toHaveBeenCalledTimes(1);
    });
  });

  describe('drawGuides', () => {
    const TREE_PADDING_GUIDES = 10;
    const REGULAR_FILL_COLOR = '#dddddd';

    beforeAll(() => {
      vi.spyOn(ConfigManager.instance, 'config', 'get').mockReturnValue({
        epiTree: {
          REGULAR_FILL_COLOR_SUPPORT_LINE: REGULAR_FILL_COLOR,
          TREE_PADDING: TREE_PADDING_GUIDES,
        },
      } as Config);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    const makeGuidesCtx = () => ({
      beginPath: vi.fn(),
      closePath: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      scale: vi.fn(),
      setLineDash: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      translate: vi.fn(),
    });

    it('calls setLineDash([3,1]) before drawing and resets to [0,0] after', () => {
      const ctx = makeGuidesCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 300,
        width: 800,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawGuides({
        canvas,
        devicePixelRatio: 1,
        geneticTreeWidth: new Decimal(0),
        horizontalScrollPosition: 0,
        pixelToGeneticDistanceRatio: 100,
        tickerMarkScale: [0, 0, 0],
        zoomLevel: 1,
      });

      expect(ctx.setLineDash).toHaveBeenCalledWith([3, 1]);
      expect(ctx.setLineDash).toHaveBeenCalledWith([0, 0]);
    });

    it('strokes one vertical line per tick mark', () => {
      const ctx = makeGuidesCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 300,
        width: 800,
      } as unknown as HTMLCanvasElement;

      // tickerMarkScale=[3,...] → 3 iterations → 3 beginPath/moveTo/lineTo/stroke/closePath calls
      EpiTreeUtil.drawGuides({
        canvas,
        devicePixelRatio: 1,
        geneticTreeWidth: new Decimal(10),
        horizontalScrollPosition: 0,
        pixelToGeneticDistanceRatio: 100,
        tickerMarkScale: [3, 5, 1],
        zoomLevel: 1,
      });

      expect(ctx.beginPath).toHaveBeenCalledTimes(3);
      expect(ctx.stroke).toHaveBeenCalledTimes(3);
      expect(ctx.closePath).toHaveBeenCalledTimes(3);
    });

    it('positions the first guide line at TREE_PADDING pixels from the left', () => {
      const ctx = makeGuidesCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 300,
        width: 800,
      } as unknown as HTMLCanvasElement;

      // tickerMarkScale=[3,5,1], genetic=10, ratio=100, zoom=1, scroll=0
      // offset = totalTicker - geneticPx = (500*2) - 1000 = 0
      // i=0: x = 0*500 + (10/1) - 0 - 0 = 10
      EpiTreeUtil.drawGuides({
        canvas,
        devicePixelRatio: 1,
        geneticTreeWidth: new Decimal(10),
        horizontalScrollPosition: 0,
        pixelToGeneticDistanceRatio: 100,
        tickerMarkScale: [3, 5, 1],
        zoomLevel: 1,
      });

      expect(ctx.moveTo).toHaveBeenNthCalledWith(1, 10, 0);
      expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 10, 300);
    });

    it('uses explicit startY and endY boundaries when provided', () => {
      const ctx = makeGuidesCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 300,
        width: 800,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawGuides({
        canvas,
        devicePixelRatio: 1,
        endY: 140,
        geneticTreeWidth: new Decimal(10),
        horizontalScrollPosition: 0,
        pixelToGeneticDistanceRatio: 100,
        startY: 40,
        tickerMarkScale: [3, 5, 1],
        zoomLevel: 1,
      });

      expect(ctx.moveTo).toHaveBeenNthCalledWith(1, 10, 40);
      expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 10, 140);
    });
  });

  describe('drawScale', () => {
    const TREE_PADDING_SCALE = 10;
    const HEADER_HEIGHT_SCALE = 40;

    beforeAll(() => {
      vi.spyOn(ConfigManager.instance, 'config', 'get').mockReturnValue({
        epiTree: {
          HEADER_HEIGHT: HEADER_HEIGHT_SCALE,
          TREE_PADDING: TREE_PADDING_SCALE,
        },
      } as Config);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    const makeScaleCtx = () => ({
      beginPath: vi.fn(),
      closePath: vi.fn(),
      fillStyle: '',
      fillText: vi.fn(),
      font: '',
      scale: vi.fn(),
      textAlign: 'left',
      translate: vi.fn(),
    });

    const makeScaleTheme = () => ({
      palette: { text: { primary: '#111111' } },
      typography: { fontFamily: 'Arial' },
    } as unknown as Theme);

    it('calls fillText once per tick mark', () => {
      const ctx = makeScaleCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 60,
        width: 800,
      } as unknown as HTMLCanvasElement;

      // tickerMarkScale=[3,5,1] → 3 fillText calls
      EpiTreeUtil.drawScale({
        canvas,
        devicePixelRatio: 1,
        geneticTreeWidth: new Decimal(10),
        horizontalScrollPosition: 0,
        pixelToGeneticDistanceRatio: 100,
        theme: makeScaleTheme(),
        tickerMarkScale: [3, 5, 1],
        zoomLevel: 1,
      });

      expect(ctx.fillText).toHaveBeenCalledTimes(3);
    });

    it('renders labels in descending order (largest distance at leftmost tick)', () => {
      const ctx = makeScaleCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 60,
        width: 800,
      } as unknown as HTMLCanvasElement;

      // tickerMarkScale=[3,5,1], labels: i=0→10, i=1→5, i=2→0
      // x positions: i=0→10, i=1→510, i=2→1010
      // y = HEADER_HEIGHT * 0.61 = 40 * 0.61 = 24.4
      EpiTreeUtil.drawScale({
        canvas,
        devicePixelRatio: 1,
        geneticTreeWidth: new Decimal(10),
        horizontalScrollPosition: 0,
        pixelToGeneticDistanceRatio: 100,
        theme: makeScaleTheme(),
        tickerMarkScale: [3, 5, 1],
        zoomLevel: 1,
      });

      expect(ctx.fillText).toHaveBeenNthCalledWith(1, '10', 10, 24.4);
      expect(ctx.fillText).toHaveBeenNthCalledWith(2, '5', 510, 24.4);
      expect(ctx.fillText).toHaveBeenNthCalledWith(3, '0', 1010, 24.4);
    });

    it('sets an explicit text fill color before drawing scale labels', () => {
      const ctx = makeScaleCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 60,
        width: 800,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawScale({
        canvas,
        devicePixelRatio: 1,
        geneticTreeWidth: new Decimal(5),
        horizontalScrollPosition: 0,
        pixelToGeneticDistanceRatio: 100,
        theme: makeScaleTheme(),
        tickerMarkScale: [1, 5, 1],
        zoomLevel: 1,
      });

      expect(ctx.fillStyle).toBe('#111111');
    });
  });

  describe('drawTreeCanvas', () => {
    const TREE_PADDING_CANVAS = 10;
    const REGULAR_FILL_CANVAS = '#eeeeee';

    beforeAll(() => {
      vi.spyOn(ConfigManager.instance, 'config', 'get').mockReturnValue({
        epiLineList: {
          TABLE_ROW_HEIGHT: 30,
        },
        epiTree: {
          ANCESTOR_DOT_RADIUS: 3,
          LEAF_DOT_RADIUS: 4,
          MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL: 5,
          REGULAR_FILL_COLOR_SUPPORT_LINE: REGULAR_FILL_CANVAS,
          TREE_PADDING: TREE_PADDING_CANVAS,
        },
      } as Config);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    const makeTreeCanvasCtx = () => ({
      beginPath: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      fillText: vi.fn(),
      font: '',
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low' as ImageSmoothingQuality,
      lineTo: vi.fn(),
      lineWidth: 0,
      moveTo: vi.fn(),
      reset: vi.fn(),
      scale: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      textAlign: 'left',
      translate: vi.fn(),
    });

    const makeTreeCanvasTheme = () => ({
      'gen-epix': {
        tree: {
          color: '#000000',
          dimFn: vi.fn((_c: string) => '#aaaaaa'),
          font: '12px mono',
        },
      },
      palette: { background: { paper: '#ffffff' } },
      typography: { fontFamily: 'Arial' },
    } as unknown as Theme);

    const makeEmptyAssembly = (): TreeAssembly => ({
      ancestorNodes: [],
      distanceTexts: [],
      horizontalAncestorTreeLines: [],
      horizontalLinePathPropertiesMap: new Map(),
      leafNodes: [],
      leafTreeLines: [],
      nodePathPropertiesMap: new Map(),
      supportLines: [],
      verticalAncestorTreeLines: [],
      verticalLinePathPropertiesMap: new Map(),
    });

    it('calls ctx.reset() before drawing', () => {
      const ctx = makeTreeCanvasCtx();
      const canvas = {
        clientHeight: 100,
        clientWidth: 200,
        getContext: vi.fn().mockReturnValue(ctx),
        height: 0,
        width: 0,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawTreeCanvas({
        canvas,
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        geneticTreeWidth: new Decimal(0),
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        pixelToGeneticDistanceRatio: 100,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTreeCanvasTheme(),
        tickerMarkScale: [0, 0, 0],
        treeAssembly: makeEmptyAssembly(),
        treeCanvasHeight: 100,
        treeCanvasWidth: 200,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });

      expect(ctx.reset).toHaveBeenCalled();
    });

    it('sets canvas dimensions from clientWidth/clientHeight × devicePixelRatio', () => {
      const ctx = makeTreeCanvasCtx();
      const canvas = {
        clientHeight: 100,
        clientWidth: 200,
        getContext: vi.fn().mockReturnValue(ctx),
        height: 0,
        width: 0,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawTreeCanvas({
        canvas,
        devicePixelRatio: 2,
        externalRange: { endIndex: 0, startIndex: 0 },
        geneticTreeWidth: new Decimal(0),
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        pixelToGeneticDistanceRatio: 100,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTreeCanvasTheme(),
        tickerMarkScale: [0, 0, 0],
        treeAssembly: makeEmptyAssembly(),
        treeCanvasHeight: 100,
        treeCanvasWidth: 200,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });

      expect(canvas.width).toBe(400);  // 200 * 2
      expect(canvas.height).toBe(200); // 100 * 2
    });

    it('sets imageSmoothingEnabled to false when zoomLevel is 1', () => {
      const ctx = makeTreeCanvasCtx();
      const canvas = {
        clientHeight: 100,
        clientWidth: 200,
        getContext: vi.fn().mockReturnValue(ctx),
        height: 0,
        width: 0,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawTreeCanvas({
        canvas,
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        geneticTreeWidth: new Decimal(0),
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        pixelToGeneticDistanceRatio: 100,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTreeCanvasTheme(),
        tickerMarkScale: [0, 0, 0],
        treeAssembly: makeEmptyAssembly(),
        treeCanvasHeight: 100,
        treeCanvasWidth: 200,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });

      expect(ctx.imageSmoothingEnabled).toBe(false);
    });

    it('sets imageSmoothingEnabled to true when zoomLevel exceeds 1', () => {
      const ctx = makeTreeCanvasCtx();
      const canvas = {
        clientHeight: 100,
        clientWidth: 200,
        getContext: vi.fn().mockReturnValue(ctx),
        height: 0,
        width: 0,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawTreeCanvas({
        canvas,
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        geneticTreeWidth: new Decimal(0),
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        pixelToGeneticDistanceRatio: 100,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTreeCanvasTheme(),
        tickerMarkScale: [0, 0, 0],
        treeAssembly: makeEmptyAssembly(),
        treeCanvasHeight: 100,
        treeCanvasWidth: 200,
        verticalScrollPosition: 0,
        zoomLevel: 2,
      });

      expect(ctx.imageSmoothingEnabled).toBe(true);
    });
  });

  describe('getPathPropertiesFromCanvas', () => {
    const makeHitTestCtx = (
      nodeShapeToHit: null | Path2D,
      hLineShapeToHit: null | Path2D,
      vLineShapeToHit: null | Path2D,
    ) => ({
      isPointInPath: vi.fn(
        (path: Path2D, _x: number, _y: number) => path === nodeShapeToHit,
      ),
      isPointInStroke: vi.fn(
        (path: Path2D, _x: number, _y: number) => path === hLineShapeToHit || path === vLineShapeToHit,
      ),
    });

    const makeMouseEvent = (clientX: number, clientY: number) => ({
      clientX,
      clientY,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    } as unknown as MouseEvent);

    it('returns node properties when isPointInPath matches a node dot', () => {
      const nodeShape = new Path2D();
      const nodeProps: TreePathProperties = { subTreeLeaveNames: ['a'], treeNode: makeLeaf('a') };
      const assembly: TreeAssembly = {
        ancestorNodes: [],
        distanceTexts: [],
        horizontalAncestorTreeLines: [],
        horizontalLinePathPropertiesMap: new Map(),
        leafNodes: [],
        leafTreeLines: [],
        nodePathPropertiesMap: new Map([[nodeShape, nodeProps]]),
        supportLines: [],
        verticalAncestorTreeLines: [],
        verticalLinePathPropertiesMap: new Map(),
      };
      const ctx = makeHitTestCtx(nodeShape, null, null);
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
      } as unknown as HTMLCanvasElement;

      const result = EpiTreeUtil.getPathPropertiesFromCanvas({
        canvas,
        devicePixelRatio: 1,
        event: makeMouseEvent(150, 200),
        treeAssembly: assembly,
      });

      expect(result).toBe(nodeProps);
    });

    it('returns horizontal line properties when isPointInStroke matches (with y tolerance)', () => {
      const hShape = new Path2D();
      const hProps: TreePathProperties = { subTreeLeaveNames: ['a', 'b'] };
      const assembly: TreeAssembly = {
        ancestorNodes: [],
        distanceTexts: [],
        horizontalAncestorTreeLines: [],
        horizontalLinePathPropertiesMap: new Map([[hShape, hProps]]),
        leafNodes: [],
        leafTreeLines: [],
        nodePathPropertiesMap: new Map(),
        supportLines: [],
        verticalAncestorTreeLines: [],
        verticalLinePathPropertiesMap: new Map(),
      };
      const ctx = makeHitTestCtx(null, hShape, null);
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
      } as unknown as HTMLCanvasElement;

      const result = EpiTreeUtil.getPathPropertiesFromCanvas({
        canvas,
        devicePixelRatio: 1,
        event: makeMouseEvent(150, 200),
        treeAssembly: assembly,
      });

      expect(result).toBe(hProps);
    });

    it('returns vertical line properties as last resort via x tolerance', () => {
      const vShape = new Path2D();
      const vProps: TreePathProperties = { subTreeLeaveNames: ['a', 'b'] };
      const assembly: TreeAssembly = {
        ancestorNodes: [],
        distanceTexts: [],
        horizontalAncestorTreeLines: [],
        horizontalLinePathPropertiesMap: new Map(),
        leafNodes: [],
        leafTreeLines: [],
        nodePathPropertiesMap: new Map(),
        supportLines: [],
        verticalAncestorTreeLines: [],
        verticalLinePathPropertiesMap: new Map([[vShape, vProps]]),
      };
      // isPointInStroke returns true only for vShape
      const ctx = makeHitTestCtx(null, null, vShape);
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
      } as unknown as HTMLCanvasElement;

      const result = EpiTreeUtil.getPathPropertiesFromCanvas({
        canvas,
        devicePixelRatio: 1,
        event: makeMouseEvent(150, 200),
        treeAssembly: assembly,
      });

      expect(result).toBe(vProps);
    });

    it('returns undefined when no path matches the cursor position', () => {
      const assembly: TreeAssembly = {
        ancestorNodes: [],
        distanceTexts: [],
        horizontalAncestorTreeLines: [],
        horizontalLinePathPropertiesMap: new Map(),
        leafNodes: [],
        leafTreeLines: [],
        nodePathPropertiesMap: new Map([[new Path2D(), { subTreeLeaveNames: [] }]]),
        supportLines: [],
        verticalAncestorTreeLines: [],
        verticalLinePathPropertiesMap: new Map(),
      };
      const ctx = makeHitTestCtx(null, null, null);
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
      } as unknown as HTMLCanvasElement;

      const result = EpiTreeUtil.getPathPropertiesFromCanvas({
        canvas,
        devicePixelRatio: 1,
        event: makeMouseEvent(150, 200),
        treeAssembly: assembly,
      });

      expect(result).toBeUndefined();
    });

    it('returns undefined when vertical paths exist but isPointInStroke returns false for all', () => {
      const vShape = new Path2D();
      const assembly: TreeAssembly = {
        ancestorNodes: [],
        distanceTexts: [],
        horizontalAncestorTreeLines: [],
        horizontalLinePathPropertiesMap: new Map(),
        leafNodes: [],
        leafTreeLines: [],
        nodePathPropertiesMap: new Map(),
        supportLines: [],
        verticalAncestorTreeLines: [],
        verticalLinePathPropertiesMap: new Map([[vShape, { subTreeLeaveNames: ['a'] }]]),
      };
      const ctx = makeHitTestCtx(null, null, null);
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
      } as unknown as HTMLCanvasElement;

      const result = EpiTreeUtil.getPathPropertiesFromCanvas({
        canvas,
        devicePixelRatio: 1,
        event: makeMouseEvent(150, 200),
        treeAssembly: assembly,
      });

      expect(result).toBeUndefined();
    });

    it('returns undefined when horizontal paths exist but isPointInStroke returns false for all', () => {
      const hShape = new Path2D();
      const assembly: TreeAssembly = {
        ancestorNodes: [],
        distanceTexts: [],
        horizontalAncestorTreeLines: [],
        horizontalLinePathPropertiesMap: new Map([[hShape, { subTreeLeaveNames: ['a'] }]]),
        leafNodes: [],
        leafTreeLines: [],
        nodePathPropertiesMap: new Map(),
        supportLines: [],
        verticalAncestorTreeLines: [],
        verticalLinePathPropertiesMap: new Map(),
      };
      // none of the shapes match → isPointInStroke always returns false
      const ctx = makeHitTestCtx(null, null, null);
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
      } as unknown as HTMLCanvasElement;

      const result = EpiTreeUtil.getPathPropertiesFromCanvas({
        canvas,
        devicePixelRatio: 1,
        event: makeMouseEvent(150, 200),
        treeAssembly: assembly,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('getTreeConfigurationId', () => {
    it('concatenates col, refCol, protocol and algorithm IDs separated by underscores', () => {
      const config: Omit<TreeConfiguration, 'computedId'> = {
        col: { id: 'col1' } as TreeConfiguration['col'],
        geneticDistanceProtocol: { id: 'gdp1' } as TreeConfiguration['geneticDistanceProtocol'],
        refCol: { id: 'rc1' } as TreeConfiguration['refCol'],
        treeAlgorithm: { id: 'algo1' } as TreeConfiguration['treeAlgorithm'],
      };
      expect(EpiTreeUtil.getTreeConfigurationId(config)).toBe('col1_rc1_gdp1_algo1');
    });

    it('handles different ID values correctly', () => {
      const config: Omit<TreeConfiguration, 'computedId'> = {
        col: { id: 'my-col' } as TreeConfiguration['col'],
        geneticDistanceProtocol: { id: 'proto-x' } as TreeConfiguration['geneticDistanceProtocol'],
        refCol: { id: 'my-ref' } as TreeConfiguration['refCol'],
        treeAlgorithm: { id: 'nj-algo' } as TreeConfiguration['treeAlgorithm'],
      };
      expect(EpiTreeUtil.getTreeConfigurationId(config)).toBe('my-col_my-ref_proto-x_nj-algo');
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
      expect(EpiTreeUtil.getTreeConfigurationLabel(config)).toBe('My Protocol - NJ Algorithm');
    });

    it('works with different protocol and algorithm names', () => {
      const config: TreeConfiguration = {
        col: { id: 'c1' } as TreeConfiguration['col'],
        computedId: 'x',
        geneticDistanceProtocol: { id: 'g1', name: 'Hamming' } as TreeConfiguration['geneticDistanceProtocol'],
        refCol: { id: 'r1' } as TreeConfiguration['refCol'],
        treeAlgorithm: { id: 'a1', name: 'UPGMA' } as TreeConfiguration['treeAlgorithm'],
      };
      expect(EpiTreeUtil.getTreeConfigurationLabel(config)).toBe('Hamming - UPGMA');
    });
  });

  describe('getTreeConfigurations', () => {
    let savedTreeAlgorithms: TreeAlgorithm[];

    const mockAlgo1: TreeAlgorithm = {
      code: 'NJ' as TreeAlgorithm['code'],
      id: 'algo-nj',
      is_ultrametric: false,
      name: 'Neighbour Joining',
      seqdb_tree_algorithm_id: 'seqdb1',
      tree_algorithm_class_id: 'class1',
    };

    const mockAlgo2: TreeAlgorithm = {
      code: 'UPGMA' as TreeAlgorithm['code'],
      id: 'algo-upgma',
      is_ultrametric: true,
      name: 'UPGMA',
      seqdb_tree_algorithm_id: 'seqdb2',
      tree_algorithm_class_id: 'class1',
    };

    beforeAll(() => {
      savedTreeAlgorithms = EpiDataManager.instance.data.treeAlgorithms;
      EpiDataManager.instance.data.treeAlgorithms = [mockAlgo1, mockAlgo2];
    });

    afterAll(() => {
      EpiDataManager.instance.data.treeAlgorithms = savedTreeAlgorithms;
    });

    it('returns empty array when no GENETIC_DISTANCE cols exist', () => {
      const completeCaseType = {
        cols: {},
        genetic_distance_protocols: {},
        ref_cols: {},
        tree_algorithms: {},
      } as unknown as Parameters<typeof EpiTreeUtil.getTreeConfigurations>[0];

      expect(EpiTreeUtil.getTreeConfigurations(completeCaseType)).toEqual([]);
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
          rc1: { col_type: ColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp1', id: 'rc1' },
        },
        tree_algorithms: {
          NJ: mockAlgo1,
          UPGMA: mockAlgo2,
        },
      } as unknown as Parameters<typeof EpiTreeUtil.getTreeConfigurations>[0];

      const result = EpiTreeUtil.getTreeConfigurations(completeCaseType);

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
          rc1: { col_type: ColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp1', id: 'rc1' },
        },
        tree_algorithms: {
          NJ: mockAlgo1,
        },
      } as unknown as Parameters<typeof EpiTreeUtil.getTreeConfigurations>[0];

      const result = EpiTreeUtil.getTreeConfigurations(completeCaseType);

      expect(result[0].computedId).toBe('col1_rc1_gdp1_algo-nj');
    });

    it('sorts algorithms according to EpiDataManager.instance.data.treeAlgorithms order', () => {
      // EpiDataManager order: [mockAlgo1(NJ), mockAlgo2(UPGMA)]
      // col specifies UPGMA first, then NJ → result should be sorted to NJ then UPGMA
      const completeCaseType = {
        cols: {
          col1: { id: 'col1', ref_col_id: 'rc1', tree_algorithm_codes: ['UPGMA', 'NJ'] },
        },
        genetic_distance_protocols: {
          gdp1: { id: 'gdp1', name: 'Protocol 1' },
        },
        ref_cols: {
          rc1: { col_type: ColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp1', id: 'rc1' },
        },
        tree_algorithms: {
          NJ: mockAlgo1,
          UPGMA: mockAlgo2,
        },
      } as unknown as Parameters<typeof EpiTreeUtil.getTreeConfigurations>[0];

      const result = EpiTreeUtil.getTreeConfigurations(completeCaseType);

      expect(result[0].treeAlgorithm.code).toBe('NJ');
      expect(result[1].treeAlgorithm.code).toBe('UPGMA');
    });
  });

  describe('drawTree', () => {
    const TREE_COLOR = '#123456';
    const DIM_COLOR = '#aabbcc';

    type CtxDrawCall = { color: string; type: 'fill' | 'stroke' };

    const makeTrackedCtx = () => {
      let currentStrokeStyle = '';
      let currentFillStyle = '';
      const drawCalls: CtxDrawCall[] = [];

      const mockCtx = {
        beginPath: vi.fn(),
        clip: vi.fn(),
        fill: vi.fn(() => {
          drawCalls.push({ color: currentFillStyle, type: 'fill' });
        }),
        fillText: vi.fn(),
        font: '',
        lineTo: vi.fn(),
        lineWidth: 0,
        moveTo: vi.fn(),
        rect: vi.fn(),
        restore: vi.fn(),
        save: vi.fn(),
        setLineDash: vi.fn(),
        setTransform: vi.fn(),
        stroke: vi.fn(() => {
          drawCalls.push({ color: currentStrokeStyle, type: 'stroke' });
        }),
        textAlign: 'left',
      };

      Object.defineProperty(mockCtx, 'strokeStyle', {
        configurable: true,
        enumerable: true,
        get: () => currentStrokeStyle,
        set: (v: string) => {
          currentStrokeStyle = v;
        },
      });

      Object.defineProperty(mockCtx, 'fillStyle', {
        configurable: true,
        enumerable: true,
        get: () => currentFillStyle,
        set: (v: string) => {
          currentFillStyle = v;
        },
      });

      return { ctx: mockCtx, drawCalls };
    };

    const makeDimFn = () => vi.fn((_c: string) => DIM_COLOR);

    const makeTheme = (dimFn: (c: string) => string) => ({
      'gen-epix': {
        tree: {
          color: TREE_COLOR,
          dimFn,
          font: '12px monospace',
        },
      },
    } as unknown as Theme);

    const makeCanvas = (ctx: ReturnType<typeof makeTrackedCtx>['ctx']): HTMLCanvasElement =>
      ({ getContext: vi.fn().mockReturnValue(ctx), height: 300, width: 400 } as unknown as HTMLCanvasElement);

    const makeAssembly = (): TreeAssembly => ({
      ancestorNodes: [],
      distanceTexts: [],
      horizontalAncestorTreeLines: [],
      horizontalLinePathPropertiesMap: new Map(),
      leafNodes: [],
      leafTreeLines: [],
      nodePathPropertiesMap: new Map(),
      supportLines: [],
      verticalAncestorTreeLines: [],
      verticalLinePathPropertiesMap: new Map(),
    });

    const p2d = () => new Path2D();

    it('calls setTransform with correct scale and offset parameters', () => {
      const { ctx } = makeTrackedCtx();
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 2,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 50,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: makeAssembly(),
        verticalScrollPosition: 100,
        zoomLevel: 2,
      });
      expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, -49.5, -99.5);
    });

    it('offsets the vertical transform by the header height when provided', () => {
      const { ctx } = makeTrackedCtx();
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 2,
        externalRange: { endIndex: 0, startIndex: 0 },
        headerHeight: 40,
        highlightedNodeNames: [],
        horizontalScrollPosition: 50,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: makeAssembly(),
        verticalScrollPosition: 100,
        zoomLevel: 2,
      });

      expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, -49.5, -19.5);
    });

    it('clips tree drawing below the header when headerHeight is provided', () => {
      const { ctx } = makeTrackedCtx();
      const canvas = {
        getContext: vi.fn().mockReturnValue(ctx),
        height: 300,
        width: 400,
      } as unknown as HTMLCanvasElement;

      EpiTreeUtil.drawTree({
        canvas,
        devicePixelRatio: 2,
        externalRange: { endIndex: 0, startIndex: 0 },
        headerHeight: 40,
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: makeAssembly(),
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.rect).toHaveBeenCalledWith(0, 80, 400, 220);
      expect(ctx.clip).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('sets initial canvas context properties after drawing', () => {
      const { ctx } = makeTrackedCtx();
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: makeAssembly(),
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.font).toBe('12px monospace');
      expect(ctx.lineWidth).toBe(1);
      expect(ctx.textAlign).toBe('center');
    });

    it('strokes every vertical ancestor tree line shape', () => {
      const { ctx } = makeTrackedCtx();
      const shape1 = p2d();
      const shape2 = p2d();
      const assembly = makeAssembly();
      assembly.verticalAncestorTreeLines = [
        { nodeNames: ['root', 'a'], shape: shape1 },
        { nodeNames: ['root', 'b'], shape: shape2 },
      ];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.stroke).toHaveBeenCalledWith(shape1);
      expect(ctx.stroke).toHaveBeenCalledWith(shape2);
    });

    it('strokes every horizontal ancestor tree line shape', () => {
      const { ctx } = makeTrackedCtx();
      const shape1 = p2d();
      const assembly = makeAssembly();
      assembly.horizontalAncestorTreeLines = [
        { nodeNames: ['root', 'a', 'b'], shape: shape1 },
      ];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.stroke).toHaveBeenCalledWith(shape1);
    });

    it('strokes every leaf tree line shape', () => {
      const { ctx } = makeTrackedCtx();
      const shapeA = p2d();
      const shapeB = p2d();
      const assembly = makeAssembly();
      assembly.leafTreeLines = [
        { nodeName: 'a', shape: shapeA },
        { nodeName: 'b', shape: shapeB },
      ];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.stroke).toHaveBeenCalledWith(shapeA);
      expect(ctx.stroke).toHaveBeenCalledWith(shapeB);
    });

    it('fills every ancestor node shape', () => {
      const { ctx } = makeTrackedCtx();
      const shape1 = p2d();
      const assembly = makeAssembly();
      assembly.ancestorNodes = [
        { nodeNames: ['root', 'a', 'b'], shape: shape1 },
      ];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.fill).toHaveBeenCalledWith(shape1);
    });

    it('fills every leaf node shape', () => {
      const { ctx } = makeTrackedCtx();
      const shapeA = p2d();
      const assembly = makeAssembly();
      assembly.leafNodes = [{ nodeName: 'a', shape: shapeA }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.fill).toHaveBeenCalledWith(shapeA);
    });

    it('does not draw support lines when externalRange is null', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.supportLines = [{ fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 15 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: null,
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: true,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: true,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.moveTo).not.toHaveBeenCalled();
      expect(ctx.lineTo).not.toHaveBeenCalled();
    });

    it('draws support lines when isLinked is false and shouldShowSupportLinesWhenUnlinked is true', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.supportLines = [{ fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 15 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: true,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 15);
      expect(ctx.lineTo).toHaveBeenCalledWith(800, 15);
    });

    it('draws support line for highlighted node when isLinked is false and shouldShowSupportLinesWhenUnlinked is false', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.supportLines = [{ fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 15 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: ['a'],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 15);
      expect(ctx.lineTo).toHaveBeenCalledWith(800, 15);
    });

    it('does not draw support lines when isLinked is false and shouldShowSupportLinesWhenUnlinked is false', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.supportLines = [{ fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 15 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.setLineDash).not.toHaveBeenCalled();
      expect(ctx.moveTo).not.toHaveBeenCalled();
      expect(ctx.lineTo).not.toHaveBeenCalled();
    });

    it('draws dashed support lines when isLinked is true', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.supportLines = [
        { fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 15 },
        { fromX: 200, fromY: 45, nodeName: 'b', toX: 800, toY: 45 },
      ];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: true,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.setLineDash).toHaveBeenCalledWith([1, 4]);
      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
      expect(ctx.beginPath).toHaveBeenCalledTimes(2);
      expect(ctx.moveTo).toHaveBeenCalledTimes(2);
      expect(ctx.lineTo).toHaveBeenCalledTimes(2);
    });

    it('draws support lines extending to toX plus the horizontal scroll offset', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      // toX=800, horizontalScrollPosition=40, devicePixelRatio=2 → lineTo(820, 15)
      assembly.supportLines = [{ fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 15 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 2,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 40,
        isLinked: true,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 15);
      expect(ctx.lineTo).toHaveBeenCalledWith(820, 15);
    });

    it('offsets support line target Y by externalScrollPosition', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.supportLines = [{ fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 45 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 2,
        externalRange: { endIndex: 0, startIndex: 0 },
        externalScrollPosition: 10,
        highlightedNodeNames: [],
        horizontalScrollPosition: 40,
        isLinked: true,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 15);
      expect(ctx.lineTo).toHaveBeenCalledWith(820, 35);
    });

    it('skips a support line when the leaf is out of the viewport and out of external range', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      // fromY=1500 is far below the canvas body (height 300), so not visible
      // toY=1500 → externalSortingIndex=50 (itemHeight=30), outside range [0,9]
      assembly.supportLines = [{ fromX: 100, fromY: 1500, nodeName: 'a', toX: 800, toY: 1500 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 9, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: true,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.moveTo).not.toHaveBeenCalled();
      expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it('draws a support line when the leaf is visible in the viewport even if out of external range', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      // fromY=15 is visible (canvas height 300), toY=1500 → externalSortingIndex=50 outside range [0,9]
      assembly.supportLines = [{ fromX: 100, fromY: 15, nodeName: 'a', toX: 800, toY: 1500 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 9, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: true,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 15);
    });

    it('draws a support line when the end position is within the external range even if leaf is out of viewport', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      // fromY=1500 is outside viewport (canvas height 300), toY=45 → externalSortingIndex=1 (itemHeight=30), inside range [0,9]
      assembly.supportLines = [{ fromX: 100, fromY: 1500, nodeName: 'a', toX: 800, toY: 45 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 9, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: true,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 1500);
    });

    it('does not call fillText when shouldShowDistances is false', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.distanceTexts = [{ nodeNames: ['a'], text: '0.5', x: 100, y: 20 }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: ['a'],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.fillText).not.toHaveBeenCalled();
    });

    it('renders distance text only for nodes present in highlightedNodeNames', () => {
      const { ctx } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.distanceTexts = [
        { nodeNames: ['a'], text: 'label-a', x: 100, y: 20 },
        { nodeNames: ['b'], text: 'label-b', x: 200, y: 50 }, // not highlighted
      ];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: ['a'],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: true,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(ctx.fillText).toHaveBeenCalledTimes(1);
      expect(ctx.fillText).toHaveBeenCalledWith('label-a', 100, 20);
    });

    it('uses full tree color for every shape when highlightedNodeNames is empty', () => {
      const { ctx, drawCalls } = makeTrackedCtx();
      const assembly = makeAssembly();
      assembly.leafTreeLines = [{ nodeName: 'a', shape: p2d() }];
      assembly.leafNodes = [{ nodeName: 'a', shape: p2d() }];
      const dimFn = makeDimFn();
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(dimFn),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      expect(dimFn).not.toHaveBeenCalled();
      expect(drawCalls.every(c => c.color === TREE_COLOR)).toBe(true);
    });

    it('dims non-highlighted shapes when highlightedNodeNames is non-empty', () => {
      const { ctx, drawCalls } = makeTrackedCtx();
      const assembly = makeAssembly();
      // leaf 'a' is highlighted; leaf 'b' is not → its line and dot should be dimmed
      assembly.leafTreeLines = [
        { nodeName: 'a', shape: p2d() },
        { nodeName: 'b', shape: p2d() },
      ];
      assembly.leafNodes = [
        { nodeName: 'a', shape: p2d() },
        { nodeName: 'b', shape: p2d() },
      ];
      const dimFn = makeDimFn();
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: ['a'],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(dimFn),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      // 'b' leaf tree line + 'b' leaf node = 2 dimmed draw calls
      const dimmedCalls = drawCalls.filter(c => c.color === DIM_COLOR);
      expect(dimmedCalls).toHaveLength(2);
      expect(dimFn).toHaveBeenCalledWith(TREE_COLOR);
    });

    it('uses the stratification caseIdColor for leaf node fill', () => {
      const { ctx, drawCalls } = makeTrackedCtx();
      const leafShape = p2d();
      const assembly = makeAssembly();
      assembly.leafNodes = [{ nodeName: 'case-1', shape: leafShape }];
      const stratification: Stratification = {
        caseIdColors: { 'case-1': '#ff0000' },
        mode: STRATIFICATION_MODE.FIELD,
      };
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      const fillCall = drawCalls.find(c => c.type === 'fill');
      expect(fillCall?.color).toBe('#ff0000');
      expect(ctx.fill).toHaveBeenCalledWith(leafShape);
    });

    it('uses the tree color for leaf node fill when stratification is null', () => {
      const { ctx, drawCalls } = makeTrackedCtx();
      const leafShape = p2d();
      const assembly = makeAssembly();
      assembly.leafNodes = [{ nodeName: 'case-1', shape: leafShape }];
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: [],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(makeDimFn()),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      const fillCall = drawCalls.find(c => c.type === 'fill');
      expect(fillCall?.color).toBe(TREE_COLOR);
    });

    it('dims ancestor tree lines (array nodeNames) that are not in highlightedNodeNames', () => {
      const { ctx, drawCalls } = makeTrackedCtx();
      const assembly = makeAssembly();
      // verticalAncestorTreeLines use nodeNames: string[], not nodeName: string
      // 'a' is highlighted; ['b','c'] is NOT highlighted → should be dimmed via Array.isArray path
      assembly.verticalAncestorTreeLines = [
        { nodeNames: ['a'], shape: p2d() },
        { nodeNames: ['b', 'c'], shape: p2d() },
      ];
      const dimFn = makeDimFn();
      EpiTreeUtil.drawTree({
        canvas: makeCanvas(ctx),
        devicePixelRatio: 1,
        externalRange: { endIndex: 0, startIndex: 0 },
        highlightedNodeNames: ['a'],
        horizontalScrollPosition: 0,
        isLinked: false,
        itemHeight: 30,
        shouldShowDistances: false,
        shouldShowSupportLinesWhenUnlinked: false,
        stratification: null,
        theme: makeTheme(dimFn),
        treeAssembly: assembly,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
      const dimmedCalls = drawCalls.filter(c => c.color === DIM_COLOR);
      expect(dimmedCalls.length).toBeGreaterThanOrEqual(1);
      expect(dimFn).toHaveBeenCalledWith(TREE_COLOR);
    });
  });
});
