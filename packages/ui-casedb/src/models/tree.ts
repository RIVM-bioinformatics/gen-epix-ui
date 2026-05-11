import type Decimal from 'decimal.js';

export type TreeAssembly = {
  ancestorNodes: Array<{ nodeNames: string[]; shape: Path2D }>;
  distanceTexts: Array<{ nodeNames: string[]; text: string; x: number; y: number }>;
  horizontalAncestorTreeLines: Array<{ nodeNames: string[]; shape: Path2D }>;
  horizontalLinePathPropertiesMap: TreeAssemblyPathPropertiesMap;
  leafNodes: Array<{ nodeName: string; shape: Path2D }>;
  leafTreeLines: Array<{ nodeName: string; shape: Path2D }>;
  nodePathPropertiesMap: TreeAssemblyPathPropertiesMap;
  supportLines: Array<{ fromX: number; fromY: number; nodeName: string; toX: number; toY: number }>;
  verticalAncestorTreeLines: Array<{ nodeNames: string[]; shape: Path2D }>;
  verticalLinePathPropertiesMap: TreeAssemblyPathPropertiesMap;
};

export type TreeNode = {
  address?: string;
  branchLength?: Decimal;
  children?: TreeNode[];
  maxBranchLength?: Decimal;
  name?: string;
  size?: number;
  subTreeLeaveNames?: string[];
  subTreeNames?: string[];
};

export type TreePathProperties = {
  subTreeLeaveNames: string[];
  treeNode?: TreeNode;
};

type TreeAssemblyPathPropertiesMap = Map<Path2D, TreePathProperties>;
